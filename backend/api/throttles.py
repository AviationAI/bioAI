from rest_framework.throttling import UserRateThrottle


class SpamThrottling(UserRateThrottle):
    rate = "120/minute"

class ModerateThrottling(UserRateThrottle):
    rate = "60/minute"