# Copyright (c) 2025, Lanz Martinez and contributors
# For license information, please see license.txt

# import frappe
from frappe.model.document import Document # orig
import frappe

class CompensatoryOvertimeCredits(Document): #orig pass
    def get_total_earned_hours(self):
        total_earned_hours = 0
        
        # Get all child records related to this parent document
        for child in self.get("coc_employee_list"):
            if child.earned_hours:
                total_earned_hours += child.earned_hours
        
        return total_earned_hours

    # Example usage method (not part of the class)
def calculate_hours_for_all_documents():
    parent_doctype = "Compensatory Overtime Credits"
    parent_records = frappe.get_all(parent_doctype, fields=["name"])
    
    for parent_record in parent_records:
        doc = frappe.get_doc(parent_doctype, parent_record["name"])
        total_hours = doc.get_total_earned_hours()
        print(f"Total Earned Hours for {doc.name}: {total_hours}")

# Example usage outside the class
calculate_hours_for_all_documents()




