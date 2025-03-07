# Copyright (c) 2025, Lanz Martinez and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _
from frappe.utils import getdate


class CompensatoryOvertimeCreditLogs(Document):
    def on_submit(self):
        print(f"Submitting CompensatoryOvertimeCreditLogs: {self.name}")  # Debug print

        try:
            print("Initializing COC Status document...")  
            coc_status = frappe.new_doc("COC Status")

            # Assigning field values and printing each assignment
            coc_status.employee = self.employee_name
            print(f"Assigned Employee: {self.employee_name}")

            coc_status.expiration = self.expiry_date
            print(f"Assigned Expiry Date: {self.expiry_date}")

            coc_status.date = self.date_of_coc_earned
            print(f"Assigned Date of COC Earned: {self.date_of_coc_earned}")

            coc_status.earned_hours = self.earned_hours
            print(f"Assigned Earned Hours: {self.earned_hours}")

            coc_status.available_hours = self.earned_hours
            print(f"Assigned Available Hours: {self.earned_hours}")

            coc_status.coc_log_reference = self.name  # Linking to parent Doc
            print(f"Assigned COC Log Reference: {self.name}")

            coc_status.status = "Available"  # Default status
            print(f"Assigned Status: Available")

            # Insert COC Status record
            print(f"Inserting COC Status for {self.employee_name}...")  
            coc_status.insert(ignore_permissions=True)
            print("COC Status inserted successfully.")

            # Submit COC Status record
            print(f"Submitting COC Status for {self.employee_name}...") 

            print("COC Status creation process completed.")  # Final debug print

        except Exception as e:
            error_msg = f"Error creating COC Status for {self.employee_name}: {str(e)}"
            print(f"ERROR: {error_msg}")
            frappe.log_error(_(error_msg), "COC Status Creation Error")
