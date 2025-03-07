# Copyright (c) 2025, Lanz Martinez and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document # orig
# import frappe

# class CompensatoryOvertimeCredits(Document): #orig pass
#     def get_total_earned_hours(self):
#         total_earned_hours = 0
        
#         # Get all child records related to this parent document
#         for child in self.get("coc_employee_list"):
#             if child.earned_hours:
#                 total_earned_hours += child.earned_hours
        
#         return total_earned_hours

#     # Example usage method (not part of the class)
# def calculate_hours_for_all_documents():
#     parent_doctype = "Compensatory Overtime Credits"
#     parent_records = frappe.get_all(parent_doctype, fields=["name"])
    
#     for parent_record in parent_records:
#         doc = frappe.get_doc(parent_doctype, parent_record["name"])
#         total_hours = doc.get_total_earned_hours()
#         print(f"Total Earned Hours for {doc.name}: {total_hours}")

# # Example usage outside the class
# calculate_hours_for_all_documents()

# import frappe
# from frappe.model.document import Document
# from frappe import _

# class CompensatoryOvertimeCredits(Document):
#     def on_submit(self):
#         """
#         Creates Compensatory Overtime Credit Logs for each employee in the table.
#         """
#         if self.employee_list_and_earned_coc:
#             for item in self.employee_list_and_earned_coc:
#                 if item.employee_name:
#                     try:
#                         # Create Compensatory Overtime Credit Log
#                         credit_log = frappe.new_doc("Compensatory Overtime Credit Logs")
#                         credit_log.created_by = self.created_by
#                         credit_log.employee_name = item.employee_name
#                         credit_log.coc_type = item.coc_type
#                         credit_log.holiday_year = item.holiday_year
#                         credit_log.overtime_description = item.overtime_description
#                         credit_log.expiry_date = item.expiry_date
#                         credit_log.deployment = item.deployment
#                         credit_log.date_of_coc_earned = item.date_of_coc_earned
#                         credit_log.earned_hours = item.earned_hours
#                         credit_log.save(ignore_permissions=True)
#                         credit_log.submit()

#                     except frappe.DoesNotExistError:
#                         frappe.log_error(_(f"Employee {item.employee_name} not found."), "Compensatory Overtime Credit Log Creation")
#                     except Exception as e:
#                         frappe.log_error(_(f"Error creating Compensatory Overtime Credit Log for {item.employee_name}: {e}"), "Compensatory Overtime Credit Log Creation")

# def remove_blank_rows(self):
#     unique_items = []
#     for item in self.employee_list_and_earned_coc:
#         is_blank = True
#         for key, value in item.as_dict().items():
#             if key not in ("name", "parent", "parentfield", "parenttype") and value:
#                 is_blank = False
#                 break
#         if not is_blank:
#             unique_items.append(item)

#     if len(self.employee_list_and_earned_coc) != len(unique_items):
#         self.employee_list_and_earned_coc = unique_items
#         frappe.msgprint(_("Blank rows removed from the table."))

# def validate(doc, method):
#     if doc.docstatus == 1 and method in ('save', 'submit'):
#         if frappe.db.exists(doc.doctype, doc.name):
#             original_doc = frappe.get_doc(doc.doctype, doc.name)
#             if original_doc.docstatus == 1:
#                 frappe.throw(_("Cannot update a submitted COC document."))

# import frappe
# from frappe.model.document import Document
# from frappe import _

# class CompensatoryOvertimeCredits(Document):
#     def on_submit(self):
#         """
#         Creates Compensatory Overtime Credit Logs for each employee in the table.
#         """
#         if self.employee_list_and_earned_coc:
#             for item in self.employee_list_and_earned_coc:
#                 if item.employee_name:
#                     try:
#                         # Create Compensatory Overtime Credit Log
#                         credit_log = frappe.new_doc("Compensatory Overtime Credit Logs")
#                         credit_log.employee_name = item.employee_name
#                         credit_log.created_by = self.created_by
#                         credit_log.coc_type = item.coc_type
#                         credit_log.holiday_year = item.holiday_year
#                         credit_log.overtime_description = item.overtime_description
#                         credit_log.expiry_date = item.expiry_date
#                         credit_log.deployment = item.deployment
#                         credit_log.date_of_coc_earned = item.date_of_coc_earned
#                         credit_log.earned_hours = item.earned_hours
#                         credit_log.compensatory_overtime_credit = self.name #Link to parent Doc
#                         credit_log.insert(ignore_permissions=True) #Use insert, then submit
#                         credit_log.submit()

#                     except frappe.DoesNotExistError:
#                         frappe.log_error(_(f"Employee {item.employee_name} not found."), "Compensatory Overtime Credit Log Creation")
#                     except Exception as e:
#                         frappe.log_error(_(f"Error creating Compensatory Overtime Credit Log for {item.employee_name}: {e}"), "Compensatory Overtime Credit Log Creation")

# def remove_blank_rows(self):
#     unique_items = []
#     for item in self.employee_list_and_earned_coc:
#         is_blank = True
#         for key, value in item.as_dict().items():
#             if key not in ("name", "parent", "parentfield", "parenttype") and value:
#                 is_blank = False
#                 break
#         if not is_blank:
#             unique_items.append(item)

#     if len(self.employee_list_and_earned_coc) != len(unique_items):
#         self.employee_list_and_earned_coc = unique_items
#         frappe.msgprint(_("Blank rows removed from the table."))

# def validate(self):
#     if self.docstatus == 1 and self.flags.on_submit != True: #check if it's on submit event
#         if frappe.db.exists(self.doctype, self.name):
#             original_doc = frappe.get_doc(self.doctype, self.name)
#             if original_doc.docstatus == 1:
#                 frappe.throw(_("Cannot update a submitted COC document."))

import frappe
from frappe.model.document import Document
from frappe import _
from frappe.utils import add_years, getdate

class CompensatoryOvertimeCredits(Document):
    def validate(self):
        for row in self.employee_list_and_earned_coc:
            if row.date_of_coc_earned and row.expiry_date:
                if getdate(row.expiry_date) <= getdate(row.date_of_coc_earned):
                    frappe.throw(_("Expiry Date must be after Date of COC Earned in row {0}".format(self.employee_list_and_earned_coc.index(row) + 1)))

    # def before_save(self):
    #     for row in self.employee_list_and_earned_coc:
    #         if row.date_of_coc_earned:
    #             row.expiry_date = add_years(row.date_of_coc_earned, 1)
    #             self.set_coc_type_and_holiday_year(row)


    # def before_save(self):
    #     doc_before_save = self.get_doc_before_save() # get old doc
    #     for i, row in enumerate(self.employee_list_and_earned_coc):
    #         if row.date_of_coc_earned:
    #             if not row.get("__expiry_date_set_manually"):
    #                 if doc_before_save and len(doc_before_save.employee_list_and_earned_coc) > i:
    #                     if doc_before_save.employee_list_and_earned_coc[i].expiry_date != row.expiry_date:
    #                         row.set("__expiry_date_set_manually", True)
    #                     else:
    #                         row.expiry_date = add_years(row.date_of_coc_earned, 1)
    #                 else:
    #                     row.expiry_date = add_years(row.date_of_coc_earned, 1)

    #             self.set_coc_type_and_holiday_year(row)

    # def before_save(self):
    #     doc_before_save = self.get_doc_before_save()
    #     for i, row in enumerate(self.employee_list_and_earned_coc):
    #         if row.date_of_coc_earned:
    #             if doc_before_save and len(doc_before_save.employee_list_and_earned_coc) > i:
    #                 if doc_before_save.employee_list_and_earned_coc[i].date_of_coc_earned != row.date_of_coc_earned :
    #                     row.set("__expiry_date_set_manually", False) # clear flag if date changed.
    #             if not row.get("__expiry_date_set_manually"):
    #                 if doc_before_save and len(doc_before_save.employee_list_and_earned_coc) > i:
    #                     if doc_before_save.employee_list_and_earned_coc[i].expiry_date != row.expiry_date:
    #                         row.set("__expiry_date_set_manually", True)
    #                     else:
    #                         row.expiry_date = add_years(row.date_of_coc_earned, 1)
    #                 else:
    #                     row.expiry_date = add_years(row.date_of_coc_earned, 1)
    #             self.set_coc_type_and_holiday_year(row)
    def before_save(self):
        doc_before_save = self.get_doc_before_save()
        for i, row in enumerate(self.employee_list_and_earned_coc):
            if row.date_of_coc_earned:
                if doc_before_save and len(doc_before_save.employee_list_and_earned_coc) > i:
                    if doc_before_save.employee_list_and_earned_coc[i].date_of_coc_earned != row.date_of_coc_earned:
                        row.set("__expiry_date_set_manually", False)
                if not row.get("__expiry_date_set_manually"):
                    if doc_before_save and len(doc_before_save.employee_list_and_earned_coc) > i:
                        if doc_before_save.employee_list_and_earned_coc[i].expiry_date != row.expiry_date:
                            row.set("__expiry_date_set_manually", True)
                        else:
                            row.expiry_date = add_years(row.date_of_coc_earned, 1)
                    else:
                        row.expiry_date = add_years(row.date_of_coc_earned, 1)
                self.set_coc_type_and_holiday_year(row)

    def set_coc_type_and_holiday_year(self, row):
        if row.date_of_coc_earned:
            holiday_lists = frappe.get_all("Holiday List", fields=["name"])
            for holiday_list in holiday_lists:
                holiday_list_doc = frappe.get_doc("Holiday List", holiday_list.name)
                for holiday in holiday_list_doc.holidays:
                    if getdate(holiday.holiday_date) == getdate(row.date_of_coc_earned):
                        row.holiday_year = holiday_list.name
                        row.coc_type = "Holiday"
                        return  # Exit after finding a match

            row.coc_type = "Rest Day"
            row.holiday_year = None # Clear holiday year if not found.

    def on_submit(self):
        if self.employee_list_and_earned_coc:
            print("Table found. Processing...") # Debug print
            for item in self.employee_list_and_earned_coc:
                print(f"Processing item: {item}") # Debug print
                if item.employee_name:
                    try:
                        credit_log = frappe.new_doc("Compensatory Overtime Credit Logs")
                        # credit_log.employee_name = item.employee_name
                        # ... other fields ...
                        # credit_log.created_by = self.created_by
                        # credit_log.coc_type = item.coc_type
                        # credit_log.holiday_year = item.holiday_year
                        # credit_log.overtime_description = item.overtime_description
                        # credit_log.expiry_date = item.expiry_date
                        # credit_log.deployment = item.deployment
                        # credit_log.date_of_coc_earned = item.date_of_coc_earned
                        # credit_log.earned_hours = item.earned_hours
                        # credit_log.compensatory_overtime_credit = self.name #Link to parent Doc
                        credit_log.employee_name = item.employee_name
                        print(f"Employee Name: {credit_log.employee_name}")
                    
                        credit_log.created_by = self.created_by
                        print(f"Created By: {credit_log.created_by}")
                    
                        credit_log.coc_type = item.coc_type
                        print(f"COC Type: {credit_log.coc_type}")
                    
                        credit_log.holiday_year = item.holiday_year
                        print(f"Holiday Year: {credit_log.holiday_year}")
                    
                        credit_log.overtime_description = self.overtime_description
                        print(f"Overtime Description: {credit_log.overtime_description}")
                    
                        credit_log.expiry_date = item.expiry_date
                        print(f"Expiry Date: {credit_log.expiry_date}")
                    
                        credit_log.is_deployment = item.is_deployment
                        print(f"Deployment: {credit_log.is_deployment}")
                    
                        credit_log.date_of_coc_earned = item.date_of_coc_earned
                        print(f"Date of COC Earned: {credit_log.date_of_coc_earned}")
                    
                        credit_log.earned_hours = item.earned_hours
                        print(f"Earned Hours: {credit_log.earned_hours}")
                        print(f"Creating log for: {item.employee_name}") # Debug print
                        credit_log.insert(ignore_permissions=True)
                        print("inserted")
                        credit_log.submit()
                        print(f"Log created for: {item.employee_name}") # Debug print
                    except frappe.DoesNotExistError:
                        print(f"Employee {item.employee_name} not found.")
                        frappe.log_error(_(f"Employee {item.employee_name} not found."), "Compensatory Overtime Credit Log Creation")
                    except Exception as e:
                        print(f"Error creating Compensatory Overtime Credit Log for {item.employee_name}: {e}")
                        frappe.log_error(_(f"Error creating Compensatory Overtime Credit Log for {item.employee_name}: {e}"), "Compensatory Overtime Credit Log Creation")
                else:
                    print("Employee name is missing in a row.") # Debug print
        else:
            print("Table employee_list_and_earned_coc is empty.") # Debug print



    def remove_blank_rows(self):
        unique_items = []
        for item in self.employee_list_and_earned_coc:
            is_blank = True
            for key, value in item.as_dict().items():
                if key not in ("name", "parent", "parentfield", "parenttype") and value:
                    is_blank = False
                    break
            if not is_blank:
                unique_items.append(item)

        if len(self.employee_list_and_earned_coc) != len(unique_items):
            self.employee_list_and_earned_coc = unique_items
            frappe.msgprint(_("Blank rows removed from the table."))
    
    def set_manually_expiry_date(self, row):
        row.set("__expiry_date_set_manually", True)
    

# def validate(self):
#     if self.docstatus == 1 and self.flags.on_submit != True: #check if it's on submit event
#         if frappe.db.exists(self.doctype, self.name):
#             original_doc = frappe.get_doc(self.doctype, self.name)
#             if original_doc.docstatus == 1:
#                 frappe.throw(_("Cannot update a submitted COC document."))

