def get_data():
	return {
		"fieldname": "holiday_list",
		"non_standard_fieldnames": {
			"Agency": "default_holiday_list",
		},
		"transactions": [
			{
				"items": ["Agency", "Employee", "Workstation"],
			},
			{"items": ["Service Level Agreement"]},
		],
	}
