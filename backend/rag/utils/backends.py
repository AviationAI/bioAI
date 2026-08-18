from .apiconfig import VECTOR_STORAGES, SESSIONS
from langchain_core.chat_history import InMemoryChatMessageHistory
import threading
import uuid
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from bioAI.settings import CHROME_DOCKER
from langchain_community.document_loaders import SeleniumURLLoader
import joblib 
import os
from .classification_training.main import train
import urllib
from urllib.parse import urlparse, urljoin
from django.core.exceptions import ValidationError
from encodings.idna import nameprep
import ipaddress
import socket
from metapub import PubMedFetcher


# With an id & time, this class deletes a vector store after a custom time limit ends
class ExpiringVectorStore:
    def __init__(self, id, time):
        self.id = id
        self.time = time
        self.timer = threading.Timer(self.time, self.expire)
        self.timer.start()
    def expire(self):
        if self.id in VECTOR_STORAGES:
            del VECTOR_STORAGES[self.id]

# Custom SeleniumURLLoader with driver customized
class CustomSeleniumURLLoader(SeleniumURLLoader):
    def _get_driver(self):

        options = Options()
        options.add_argument("--headless")

        # Optionally add eager mode if takes too many resources (options.set_capability("pageLoadStrategy", "eager"))

        driver = webdriver.Remote(
            command_executor = CHROME_DOCKER,
            options = options
        )

        driver.set_page_load_timeout(10)
        driver.set_script_timeout(5)
        return driver

# This gets a session by its id, and if none exists, created one in its place
def get_session(session_id: uuid.UUID) -> InMemoryChatMessageHistory:
    if session_id not in SESSIONS:
        SESSIONS[session_id] = InMemoryChatMessageHistory()
    return SESSIONS[session_id]

def get_classifier():

    # Training and returning model
    model = train()

    return model

# Validation of URL
def validate_url(url: str) -> str:

    extra_blocked = [
        ipaddress.ip_network("100.64.0.0/10"),   # CGNAT (is_global bug in Python <= 3.10)
        ipaddress.ip_network("192.0.2.0/24"),    # TEST-NET-1
        ipaddress.ip_network("198.51.100.0/24"), # TEST-NET-2
        ipaddress.ip_network("203.0.113.0/24"),  # TEST-NET-3
    ]

    blocked_hosts = [
        "localhost",
        "0.0.0.0",
        "metadata",
        "metadata.google.internal",
        "db",
        "web",
        "backend",
        "redis",
        "search",
        "chrome",
        "postgres"
    ]
    

    parsed = urlparse(url)

    if parsed.scheme not in {"https", "http"}:
        raise ValidationError(f"Scheme {parsed.scheme} not allowed")
    
    # 2, Validating port
    if parsed.port not in {80, 443, None}:
        raise ValidationError(f"Port {parsed.port} is not allowed")

    # 3. Validating host
    host = parsed.hostname

    if host is None:
        raise ValidationError("No hostname given")

    try:
        host = nameprep(host)
    except UnicodeError:
        raise ValidationError("Invalid hostname encoding")

    if len(host) <= 0:
        raise ValidationError("Host is empty string")
    
    if host in blocked_hosts:
        raise ValidationError(f"Host: {host} is in blocked host list")
    
    # Block direct IPs before DNS lookups (purely for design purposes)
    try:
        direct_ip = ipaddress.ip_address(host)
        if (
            not direct_ip.is_global or
            direct_ip.is_private or
            direct_ip.is_loopback or
            direct_ip.is_link_local or
            direct_ip.is_multicast or
            direct_ip.is_reserved
        ):
            raise ValidationError(f"Direct IP {direct_ip} not allowed")
        if any(direct_ip in network for network in extra_blocked):
            raise ValidationError(f"Direct IP {direct_ip} in blocked list")
    except ValueError:
        pass
    
    try:
        # Getting address info
        resolved_ips = socket.getaddrinfo(host, None)
    except socket.gaierror:
        raise ValidationError(f"Could not resolve host {host}")

    for resolved_ip in resolved_ips:

        try:
            ip = ipaddress.ip_address(resolved_ip[4][0])
        except ValueError:
            raise ValidationError(f"Could not parse resolved IP Address: {resolved_ip[4][0]}")
        
        # Checking ip type
        if (
            not ip.is_global or 
            ip.is_private or
            ip.is_loopback or
            ip.is_link_local or
            ip.is_multicast or
            ip.is_reserved
        ):
            raise ValidationError("Incompatible IP type")
        
        # Checking if ip in blocked networks
        if any(ip in network for network in extra_blocked):
            raise ValidationError(f"IP: {ip} is in blocklist")


# Resolving urls step by step to prevent redirect chaining 
def resolve_and_validate_url(url: str)-> str:

    max_redirects = 5

    # url being validated
    current_url = url
    
    # visited to prevent redirect loops
    visited = set()

    session = requests.Session()

    for _ in range(max_redirects):

        validate_url(current_url)

        try:
            response = session.get(
                current_url,
                allow_redirects = False,
                stream = True,
                timeout = (5, 7)
            )
            response.close()

        except requests.exceptions.InvalidURL:
            raise ValidationError("Invalid URL format")
        
        except requests.exceptions.ConnectTimeout:
            raise ValidationError("Connection timed out")

        # Detecting redirect loop
        
        cookies = response.request.headers.get("Cookie")

        if (current_url, cookies) in visited:
            raise ValidationError("Redirect Loop Detected")

        visited.add((current_url, cookies))


        # Checking if another redirect

        if response.status_code not in {301, 302, 303,  307, 308}:
            return current_url
        
        location = response.headers.get("Location")

        if not location:
            raise ValidationError("Malformed redirect response")
        

        # urljoin in case of relative redirects
        current_url = urljoin(current_url, location)
    
    raise ValidationError("Too many redirects")


def is_pubmed(url: str) -> tuple[bool, bool]:

    # Output is tuple[bool, bool] where first bool is if it is pubmed, and second for if it is legacy


    try: 
        parsed = urlparse(url)
        hostname = parsed.hostname
        path = parsed.path

        # legacy
        if hostname in ["ncbi.nlm.nih.gov", "www.ncbi.nlm.nih.gov"] and path.startswith("/pubmed"):
            return (True, False)

        # modern
        if hostname == "pubmed.ncbi.nlm.nih.gov":
            return (True, True)

        raise Exception
    
    except:
        return False

def scrape_pubmed(url: str, modern: bool):

    # Outputs scraped pubmed article via api


    path = urlparse(url).path
    fetch = PubMedFetcher()

    if modern:
        pmid = path.split("/")[0]
    else:
        pmid = path.split("/")[1]

    return fetch.article_by_pmid(pmid)



