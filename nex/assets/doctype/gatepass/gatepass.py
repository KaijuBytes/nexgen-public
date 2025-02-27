# # Copyright (c) 2025, Lanz Martinez and contributors
# # For license information, please see license.txt

# import frappe
# from frappe.model.document import Document
# from frappe import _

# class Gatepass(Document):
#     def on_submit(self):
#         """
#         Update Asset asset_location and asset_location_details based on Gatepass location and location_details after submission.
#         """
#         if self.location and self.gatepass_items:
#             for item in self.gatepass_items:
#                 if item.asset:
#                     try:
#                         asset_doc = frappe.get_doc("Asset", item.asset)
#                         asset_doc.asset_location = self.location
#                         asset_doc.asset_location_details = self.location_details # Added this line
#                         asset_doc.save()
#                     except frappe.DoesNotExistError:
#                         frappe.log_error(f"Asset {item.asset} not found.", "Gatepass Asset Update")
#                     except Exception as e:
#                         frappe.log_error(f"Error updating Asset {item.asset}: {e}", "Gatepass Asset Update")
                        

# # gatepass.py

# def validate(self):
#     self.validate_unique_serial_numbers()
#     self.remove_blank_rows()

# def validate_unique_serial_numbers(self):
#     seen = set()
#     duplicates = []
#     unique_items = []

#     for item in self.gatepass_items:
#         if item.serial_number:
#             if item.serial_number in seen:
#                 duplicates.append(item)
#             else:
#                 seen.add(item.serial_number)
#                 unique_items.append(item)
#         else:
#             unique_items.append(item)

#     if duplicates:
#         self.gatepass_items = unique_items
#         frappe.msgprint(_("Duplicate serial numbers removed from the table."))

# def remove_blank_rows(self):
#     unique_items = []
#     for item in self.gatepass_items:
#         is_blank = True
#         for key, value in item.as_dict().items():
#             if key not in ("name", "parent", "parentfield", "parenttype") and value:
#                 is_blank = False
#                 break
#         if not is_blank:
#             unique_items.append(item)

#     if len(self.gatepass_items) != len(unique_items):
#         self.gatepass_items = unique_items
#         frappe.msgprint(_("Blank rows removed from the table."))
        
# def validate(self):
#     item_count = len(self.gatepass_items)
#     self.total_items = item_count

# # import frappe

# def validate(doc, method):
#     if doc.docstatus == 1 and method in ('save', 'submit'):
#         if frappe.db.exists(doc.doctype, doc.name):
#             original_doc = frappe.get_doc(doc.doctype, doc.name)
#             if original_doc.docstatus == 1:
#                 frappe.throw(_("Cannot update a submitted Gatepass document."))


# Copyright (c) 2025, Lanz Martinez and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _

class Gatepass(Document):
    def on_submit(self):
        """
        Create Asset Logs for each asset based on the gatepass after submission.
        """
        if self.location and self.gatepass_items:
            for item in self.gatepass_items:
                if item.asset:
                    try:
                        # Create Asset Log
                        asset_log = frappe.new_doc("Asset Logs")
                        asset_log.asset_number = item.asset
                        asset_log.log_date = self.transaction_date
                        asset_log.location_update = self.location
                        asset_log.location_details = self.location_details
                        asset_log.gatepass = self.name # Link the Asset Log to the Gatepass
                        asset_log.type_of_log = self.inout # Set the type of log.
                        asset_log.subject = f"Gatepass: {self.name}, Asset: {item.asset}" #Set the subject
                        asset_log.description = f"Asset Log created via Gatepass: {self.name}"
                        asset_log.save(ignore_permissions=True) # Ensure saving even with permission issues
                        asset_log.submit()

                    except frappe.DoesNotExistError:
                        frappe.log_error(f"Asset {item.asset} not found.", "Gatepass Asset Log Creation")
                    except Exception as e:
                        frappe.log_error(f"Error creating Asset Log for {item.asset}: {e}", "Gatepass Asset Log Creation")
                        
def validate(self):
    self.validate_unique_serial_numbers()
    self.remove_blank_rows()
    item_count = len(self.gatepass_items)
    self.total_items = item_count

def validate_unique_serial_numbers(self):
    seen = set()
    duplicates = []
    unique_items = []

    for item in self.gatepass_items:
        if item.serial_number:
            if item.serial_number in seen:
                duplicates.append(item)
            else:
                seen.add(item.serial_number)
                unique_items.append(item)
        else:
            unique_items.append(item)

    if duplicates:
        self.gatepass_items = unique_items
        frappe.msgprint(_("Duplicate serial numbers removed from the table."))

def remove_blank_rows(self):
    unique_items = []
    for item in self.gatepass_items:
        is_blank = True
        for key, value in item.as_dict().items():
            if key not in ("name", "parent", "parentfield", "parenttype") and value:
                is_blank = False
                break
        if not is_blank:
            unique_items.append(item)

    if len(self.gatepass_items) != len(unique_items):
        self.gatepass_items = unique_items
        frappe.msgprint(_("Blank rows removed from the table."))

def validate(doc, method):
    if doc.docstatus == 1 and method in ('save', 'submit'):
        if frappe.db.exists(doc.doctype, doc.name):
            original_doc = frappe.get_doc(doc.doctype, doc.name)
            if original_doc.docstatus == 1:
                frappe.throw(_("Cannot update a submitted Gatepass document."))