class LeadProviderError(Exception):
    pass


class LocationNotFoundError(LeadProviderError):
    pass
