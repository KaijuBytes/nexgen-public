from datetime import datetime, timedelta

class CustomDateFilters:
    @staticmethod
    def get_days_ago(days):
        """Returns the date `days` ago in YYYY-MM-DD format."""
        return (datetime.now() - timedelta(days=days)).strftime('%Y-%m-%d')

    @staticmethod
    def get_20_days_ago():
        return CustomDateFilters.get_days_ago(20)

    @staticmethod
    def get_8_days_ago():
        return CustomDateFilters.get_days_ago(8)

    @staticmethod
    def get_7_days_ago():
        return CustomDateFilters.get_days_ago(7)

    @staticmethod
    def get_4_days_ago():
        return CustomDateFilters.get_days_ago(4)

    @staticmethod
    def get_3_days_ago():
        return CustomDateFilters.get_days_ago(3)