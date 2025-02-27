# # Copyright (c) 2025, Lanz Martinez and contributors
# # For license information, please see license.txt

# # import frappe
# from frappe.model.document import Document


# class Asset(Document):
# 	pass

import frappe
from frappe.model.document import Document

class Asset(Document):
    def validate(self):
        self.title = f"{self.asset_name} - {self.serial_number}"