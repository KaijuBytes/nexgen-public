# Copyright (c) 2025, Lanz Martinez and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Employee(Document):
	pass

@frappe.whitelist()
def create_user(employee, user=None, email=None):
	emp = frappe.get_doc("Employee", employee)

	employee_name = emp.employee_name.split(" ")
	middle_name = last_name = ""

	if len(employee_name) >= 3:
		last_name = " ".join(employee_name[2:])
		middle_name = employee_name[1]
	elif len(employee_name) == 2:
		last_name = employee_name[1]

	first_name = employee_name[0]

	if email:
		emp.prefered_email = email

	user = frappe.new_doc("User")
	user.update(
		{
			"name": emp.employee_name,
			"email": emp.prefered_email,
			"enabled": 1,
			"first_name": first_name,
			"middle_name": middle_name,
			"last_name": last_name,
			"gender": emp.gender,
			"birth_date": emp.date_of_birth,
			"phone": emp.cell_number,
			"bio": emp.bio,
		}
	)
	user.insert()
	emp.user_id = user.name
	emp.save()
	return user.name

# training_event_name = "Training Event"
# training_event = frappe.get_doc("Training Event", training_event_name)

# for employee_entry in training_event.internal_trainees:
#     employee = frappe.get_doc("Employee", employee_entry.employee)  # Get the Employee document
#     print(f"Employee: {employee.name}, Status: {employee_entry.status}")

def update_employee_training_history(doc, method):
    """
    Updates the employee's training history when a Training Event's status is "Complete".
    """
    if doc.event_status == "Complete" and doc.internal_trainees:
        for trainee in doc.internal_trainees:
            if trainee.employee:
                try:
                    employee = frappe.get_doc("Employee", trainee.employee)
                    training_entry = {
                        "training_event": doc.name,
                        "course": doc.course,
                        "event_date": doc.event_date,
                        # Add other relevant fields if needed
                    }
                    if not employee.training_history:
                        employee.training_history = []  # Initialize if empty
                    employee.training_history.append(training_entry)
                    employee.save()
                    frappe.msgprint(f"Training history updated for {employee.employee_name}")

                except frappe.DoesNotExistError:
                    frappe.log_error(f"Employee {trainee.employee} not found.", "Employee Update Error")
                except Exception as e:
                    frappe.log_error(frappe.get_traceback(), "Training History Update Error")
                    frappe.msgprint(f"An error occurred while updating training history for {trainee.employee}: {e}")