from rest_framework.throttling import UserRateThrottle


class SpamThrottling(UserRateThrottle):
    rate = "150/minute"

class ModerateThrottling(UserRateThrottle):
    rate = "60/minute"