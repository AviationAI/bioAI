from django.test import TestCase
from django.core.exceptions import ValidationError
from unittest.mock import patch, MagicMock
from .utils.backends import resolve_and_validate_url


# Create your tests here.
class URLValidationTestCase(TestCase):

    # Several test lists

    # should PASS
    basic_allowed_urls = [
        "https://example.com",
        "https://www.wikipedia.org",
        "https://arxiv.org/abs/1234.5678"
    ]

    # should FAIL
    scheme_attacks = [
        "file:///etc/passwd",
        "ftp://example.com",
        "gopher://example.com",
        "data:text/html,<script>alert(1)</script>",
        "jar:http://evil.com"
    ]

    # should FAIL
    internal_hostnames = [
        "http://localhost",
        "http://127.0.0.1",
        "http://0.0.0.0",
        "http://[::1]",
        "http://metadata",
        "http://metadata.google.internal",
        "http://db",
        "http://redis",
        "http://postgres",
        "http://backend"
    ]

    # should FAIL
    private_ip_ranges = [
        "http://10.0.0.1",
        "http://10.255.255.255",
        "http://172.16.0.1",
        "http://172.31.255.255",
        "http://192.168.0.1",
        "http://192.168.1.1"
    ]   

    # should FAIL
    link_local = [
        "http://169.254.169.254",
        "http://169.254.0.1"
    ]

    # should FAIL
    reserved_ip_ranges = [
        "http://192.0.2.1",
        "http://198.51.100.1",
        "http://203.0.113.1",
        "http://100.64.0.1"
    ]

    # should FAIL
    redirect_based_attacks = [
        MagicMock(status_code = 302, headers = {"Location": "http://127.0.0.1"}),
        MagicMock(status_code = 307, headers = {"Location": "http://169.254.169.254"}),
        MagicMock(status_code = 308, headers = {"Location": "http://172.31.255.255"}),
        MagicMock(status_code = 303, headers = {"Location": "http://localhost:8000"})
    ]


    unicode = [
        "http://ⓔⓧⓐⓜⓟⓛⓔ.com",
        "http://exаmple.com"   # (Cyrillic 'a' trick)
    ]


    # Results that mock socket.getaddrinfo()

    mock_results_fail = [
        [(2, 1, 6, '', ('127.0.0.1', 0))],
        [(2, 1, 6, '', ('192.168.1.1', 0))],
        [(2, 1, 6, '', ('169.254.169.254', 0))],
    ]

    mock_results_pass = [
        [(2, 1, 6, '', ('142.250.80.46', 0))]
    ]

    # should fail
    hex_ipv4 = [
        "http://0x7f000001",
        "http://0xC0A80101",
        "http://0xAC100001",
    ]

    # should fail
    hex_with_ports = [
        "http://0x7f000001:80",
        "http://2130706433:8080",
    ]

    # should fail
    integer_ips = [
        "http://2130706433",
        "http://3232235777",
    ]

    # should fail
    octal_integer_ips = [
        "http://017700000001",
        "http://0o12000000001",
        "http://0o12000000377",
        "http://0o2540200000001",
        "http://0o25403777777",
        "http://0o300250000001",
        "http://0o300250377377",
        "0o17700000001",
        "0o17700000377",
        "0o25137600000001",
        "0o2513760377377", 
    ]

    # should fail
    octal_ips = [
        "0300.0250.000.000",
        "0300.0250.377.377",
        "0254.037.377.377"
    ]

    def test_scheme_attakcs(self):

        for url in self.scheme_attacks:

            # cases should fail
            with self.assertRaises(ValidationError):
                resolve_and_validate_url(url)

    def test_internal_hostnames(self):
        
        for url in self.internal_hostnames:

            # cases should fail
            with self.assertRaises(ValidationError):
                resolve_and_validate_url(url)
    
    def test_private_ip_ranges(self):
        
        for url in self.private_ip_ranges:

            # cases should fail
            with self.assertRaises(ValidationError):
                resolve_and_validate_url(url)

    def test_link_local(self):
        
        for url in self.link_local:

            # cases should fail
            with self.assertRaises(ValidationError):
                resolve_and_validate_url(url)

    def test_reserved_ip_ranges(self):
        
        for url in self.reserved_ip_ranges:

            # cases should fail
            with self.assertRaises(ValidationError):
                resolve_and_validate_url(url)
    
    def test_redirect_attacks(self):
        
        for response in self.redirect_based_attacks:
            for url in self.basic_allowed_urls:
                
                # mocking result of requests.get
                with patch("rag.utils.backends.requests.get", return_value = response):
                    
                    # cases should fail
                    with self.assertRaises(ValidationError):
                        resolve_and_validate_url(url)

    def test_unicode(self):
        
        for url in self.unicode:

            # cases should fail
            with self.assertRaises(ValidationError):
                resolve_and_validate_url(url)

    def test_dns_resolution_attack(self):
        
        for result in self.mock_results_fail:
            for url in self.basic_allowed_urls:

                # mocking the result of getaddrinfo func
                with patch("rag.utils.backends.socket.getaddrinfo", return_value = result):

                    # case should fail
                    with self.assertRaises(ValidationError):
                        resolve_and_validate_url(url)

    def test_allow_public_ip(self):
        
        mock_response = MagicMock(
            status_code=200,
            headers={}
        )
        for result in self.mock_results_pass:
            for url in self.basic_allowed_urls:

                # mocking the result of getaddrinfo func
                with patch("rag.utils.backends.socket.getaddrinfo", return_value = result):
                    with patch("rag.utils.backends.requests.get", return_value = mock_response):

                        # case should pass
                        resolve_and_validate_url(url)
    
    def test_basic_allowed_cases(self):

        for url in self.basic_allowed_urls:

            # if it fails, unit test will automaticaly fail
            resolve_and_validate_url(url)
    
    def test_hex_ips(self):

        for url in self.hex_ipv4 + self.hex_with_ports:
             
            # case should fail
            with self.assertRaises(ValidationError):
                resolve_and_validate_url(url)
    
    def test_integer_ips(self):

        for url in self.integer_ips:

            # case should fail
            with self.assertRaises(ValidationError):
                resolve_and_validate_url(url)

    def test_octal_ips(self):

        for url in self.octal_integer_ips + self.octal_ips:

            # case should fail
            with self.assertRaises(ValidationError):
                resolve_and_validate_url(url)
    
