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

        if self.length or self.width or self.height:
            if not self.length:
                frappe.throw("Length is required when width or height is provided.")
            if self.length == 0:
                frappe.throw("Length cannot be 0.")
            if not self.width:
                frappe.throw("Width is required when length or height is provided.")
            if self.width == 0:
                frappe.throw("Width cannot be 0.")
            if not self.height:
                frappe.throw("Height is required when length or width is provided.")
            if self.height == 0:
                frappe.throw("Height cannot be 0.")

            self.dimension = self.length * self.width * self.height
        else:
            self.dimension = 0 #or None, depending on what you want dimension to be if no dimensions are provided.