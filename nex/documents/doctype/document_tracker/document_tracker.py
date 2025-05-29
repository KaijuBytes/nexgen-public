# # Copyright (c) 2025, Lanz Martinez and contributors
# # For license information, please see license.txt

# import frappe
# from frappe.model.document import Document
# import datetime

# class DocumentTracker(Document):
#     def autoname(self):
#         now = datetime.datetime.now()
#         year = now.strftime("%Y")
#         month = now.strftime("%m")
#         prefix = f"DRRMD-{year}{month}-"

#         # Find the latest document for the current month
#         latest_doc = frappe.db.sql(
#             """
#             SELECT name
#             FROM `tabDocument Tracker`
#             WHERE name LIKE %s
#             ORDER BY name DESC
#             LIMIT 1
#             """,
#             (prefix + "%",),
#             as_dict=True,
#         )

#         if latest_doc:
#             latest_name = latest_doc[0]["name"]
#             try:
#                 latest_sequence = int(latest_name.split("-")[-1])
#                 new_sequence = latest_sequence + 1
#             except (IndexError, ValueError):
#                 new_sequence = 1
#         else:
#             new_sequence = 1

#         self.name = f"{prefix}{new_sequence:03d}"

# Copyright (c) 2025, Lanz Martinez and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
import datetime

class DocumentTracker(Document):
    def autoname(self):
        now = datetime.datetime.now()
        year = now.strftime("%Y")
        month = now.strftime("%m")
        prefix = f"DRRMD-{year}{month}-"

        # Find the latest document for the current month
        latest_doc = frappe.db.sql(
            """
            SELECT name
            FROM `tabDocument Tracker`
            WHERE name LIKE %s
            ORDER BY name DESC
            LIMIT 1
            """,
            (prefix + "%",),
            as_dict=True,
        )

        if latest_doc:
            latest_name = latest_doc[0]["name"]
            try:
                latest_sequence = int(latest_name.split("-")[-1])
                new_sequence = latest_sequence + 1
            except (IndexError, ValueError):
                new_sequence = 1
        else:
            new_sequence = 1

        self.name = f"{prefix}{new_sequence:03d}"

# @frappe.whitelist()
# def create_document_tracker_log(dt_control_number):
#     """Creates and saves a Document Tracker Log."""
#     doc_log = frappe.new_doc("Document Tracker Logs")
#     doc_log.dt_control_number = dt_control_number
#     # Add any other default values or logic here if needed
#     doc_log.insert()  # Or doc_log.save()
#     frappe.msgprint(f"Document Tracker Log created and saved for {dt_control_number}")
#     return doc_log

@frappe.whitelist()
def create_task_from_tracker(title, priority, task_description, doctracker_reference):
    """Creates and saves a Task based on Document Tracker data, ensuring only one Task per Tracker."""

    existing_task = frappe.db.exists({
        'doctype': 'Task',
        'doctracker_reference': doctracker_reference
    })

    if existing_task:
        frappe.msgprint(f"A Task already exists for Document Tracker '{doctracker_reference}'. <a href='/app/task/{existing_task}'>View Task {existing_task}</a>")
        return
    else:
        task = frappe.new_doc("Task")
        task.subject = title
        task.priority = priority
        now = datetime.datetime.now()
        timestamp_str = now.strftime("%Y-%m-%d %H:%M:%S")
        task.task_description = f"<p>Created via Document Tracker '{doctracker_reference}' on {timestamp_str}:</p></br><p>{task_description}</p>"
        task.doctracker_reference = doctracker_reference
        task.insert()  # Or task.save()
        frappe.msgprint(f"Task '{title}' created and saved with ID: <a href='/app/task/{task.name}'>View Task {task.name}</a>")
        return task