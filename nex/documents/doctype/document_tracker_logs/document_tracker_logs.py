# Copyright (c) 2025, Lanz Martinez and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class DocumentTrackerLogs(Document):
# 	pass

# import frappe
# from frappe.model.document import Document
# from frappe import _

# class DocumentTrackerLogs(Document):
#     def on_submit(self):  # This runs AFTER the document is submitted
#         if self.tracker_status == "Done":
#             if self.dt_control_number:
#                 parent_doc = frappe.get_doc("Document Tracker", self.dt_control_number)
#                 parent_doc.status = "Completed"
#                 parent_doc.save()
#             else:
#                 frappe.throw(_("Document Tracker is not linked via dt_control_number"))


# import frappe
# from frappe.model.document import Document
# from frappe import _

# class DocumentTrackerLogs(Document):
#     def on_submit(self):
#         if self.dt_control_number:
#             parent_doc = frappe.get_doc("Document Tracker", self.dt_control_number)

#             if self.to == "IMB-DRRMD":
#                 parent_doc.latest_location = self.to  # Update latest_location
#                 parent_doc.save()

#             if self.tracker_status == "Done":
#                 parent_doc.status = "Completed"
#                 parent_doc.save()
#         else:
#             frappe.throw(_("Document Tracker is not linked via dt_control_number"))

# import frappe
# from frappe.model.document import Document
# from frappe import _

# class DocumentTrackerLogs(Document):
#     def on_submit(self):
#         if self.dt_control_number:
#             parent_doc = frappe.get_doc("Document Tracker", self.dt_control_number)

#             if self.to == "IMB-DRRMD": #or self.to == "IMB-OBD" or self.to == "IMB-ADMIN"
#                 self.log_icon = '<i class="fa fa-download"></i>'
#                 parent_doc.location_icon = '<i class="fa fa-download"></i>' # Update parent icon
#             else:
#                 self.log_icon = '<i class="fa fa-upload"></i>'
#                 parent_doc.location_icon = '<i class="fa fa-upload"></i>' # Update parent icon

#             if self.to == "IMB-DRRMD":
#                 parent_doc.latest_location = self.to
#                 parent_doc.save()

#             if self.tracker_status == "Done":
#                 parent_doc.status = "Completed"
#                 parent_doc.save()
#             parent_doc.save() #save parent doc with the location_icon change.
#         else:
#             frappe.throw(_("Document Tracker is not linked via dt_control_number"))

# import frappe
# from frappe.model.document import Document
# from frappe import _

# class DocumentTrackerLogs(Document):
#     def on_submit(self):
#         if self.dt_control_number:
#             parent_doc = frappe.get_doc("Document Tracker", self.dt_control_number)

#             if self.to == "IMB-DRRMD":# or self.to == "IMB-OBD" or self.to == "IMB-ADMIN":
#                 self.log_icon = '<i class="fa fa-download" style="color: green;"></i>'
#                 parent_doc.location_icon = '<i class="fa fa-download" style="color: green;"></i>'
#             else:
#                 self.log_icon = '<i class="fa fa-upload" style="color: red;"></i>'
#                 parent_doc.location_icon = '<i class="fa fa-upload" style="color: red;"></i>'

#             parent_doc.latest_location = self.to #update latest location
#             parent_doc.save() #save the parent doc

#             if self.tracker_status == "Done":
#                 parent_doc.status = "Completed"
#                 parent_doc.save()

#             # Update location_icon in ALL Document Tracker documents
#             for doc in frappe.get_all("Document Tracker"):
#                 doc = frappe.get_doc("Document Tracker", doc.name)
#                 if doc.latest_location == "IMB-DRRMD": #or doc.latest_location == "IMB-OBD" or doc.latest_location == "IMB-ADMIN":
#                     doc.location_icon = '<i class="fa fa-download" style="color: green;"></i>'
#                 else:
#                     doc.location_icon = '<i class="fa fa-upload" style="color: red;"></i>'
#                 doc.save()
#         else:
#             frappe.throw(_("Document Tracker is not linked via dt_control_number"))

# import frappe
# from frappe.model.document import Document
# from frappe import _

# class DocumentTrackerLogs(Document):
#     def autoname(self):
#         dt_control_number = self.dt_control_number
#         if not dt_control_number:
#             return None  # Or handle the case where dt_control_number is missing

#         doctype_name = self.doctype

#         # Find the latest sequence number for this dt_control_number
#         latest_doc = frappe.db.sql(
#             """
#             SELECT name
#             FROM "tabDocument Tracker Logs"
#             WHERE dt_control_number = %s AND name LIKE %s
#             ORDER BY name DESC
#             LIMIT 1
#             """,
#             (dt_control_number, f"%{dt_control_number}-LOG-%"),
#             as_dict=True,
#         )

#         if latest_doc:
#             latest_name = latest_doc[0]["name"]
#             try:
#                 latest_sequence = int(latest_name.split("-LOG-")[1])
#                 new_sequence = latest_sequence + 1
#             except (IndexError, ValueError):
#                 new_sequence = 1
#         else:
#             new_sequence = 1

#         self.name = f"{dt_control_number}-LOG-{new_sequence:03d}"

#     def on_submit(self):
#         if self.dt_control_number:
#             parent_doc = frappe.get_doc("Document Tracker", self.dt_control_number)

#             if self.to == "IMB-DRRMD":  # or self.to == "IMB-OBD" or self.to == "IMB-ADMIN":
#                 self.log_icon = '<i class="fa fa-download" style="color: green;"></i>'
#                 parent_doc.location_icon = '<i class="fa fa-download" style="color: green;"></i>'
#             else:
#                 self.log_icon = '<i class="fa fa-upload" style="color: red;"></i>'
#                 parent_doc.location_icon = '<i class="fa fa-upload" style="color: red;"></i>'

#             parent_doc.latest_location = self.to  # update latest location
#             parent_doc.save()  # save the parent doc

#             if self.tracker_status == "Done":
#                 parent_doc.status = "Completed"
#                 parent_doc.save()

#             # Update location_icon in ALL Document Tracker documents
#             for doc in frappe.get_all("Document Tracker"):
#                 doc = frappe.get_doc("Document Tracker", doc.name)
#                 if doc.latest_location == "IMB-DRRMD":  # or doc.latest_location == "IMB-OBD" or doc.latest_location == "IMB-ADMIN":
#                     doc.location_icon = '<i class="fa fa-download" style="color: green;"></i>'
#                 else:
#                     doc.location_icon = '<i class="fa fa-upload" style="color: red;"></i>'
#                 doc.save()
#         else:
#             frappe.throw(_("Document Tracker is not linked via dt_control_number"))

import frappe
from frappe.model.document import Document
from frappe import _

class DocumentTrackerLogs(Document):
    def autoname(self):
        dt_control_number = self.dt_control_number
        if not dt_control_number:
            return None

        doctype_name = self.doctype

        latest_doc = frappe.db.sql(
            """
            SELECT name
            FROM "tabDocument Tracker Logs"
            WHERE dt_control_number = %s AND name LIKE %s
            ORDER BY name DESC
            LIMIT 1
            """,
            (dt_control_number, f"%{dt_control_number}-LOG-%"),
            as_dict=True,
        )

        if latest_doc:
            latest_name = latest_doc[0]["name"]
            try:
                latest_sequence = int(latest_name.split("-LOG-")[1])
                new_sequence = latest_sequence + 1
            except (IndexError, ValueError):
                new_sequence = 1
        else:
            new_sequence = 1

        self.name = f"{dt_control_number}-LOG-{new_sequence:03d}"

    def on_submit(self):
        if self.dt_control_number:
            parent_doc = frappe.get_doc("Document Tracker", self.dt_control_number)

            if self.to == "IMB-DRRMD":
                self.log_icon = f'<i class="fa fa-download" style="color: green;" data-tooltip="{self.to}"></i> {self.to}'
                parent_doc.location_icon = f'<i class="fa fa-download" style="color: green;" data-tooltip="{self.to}"></i> {self.to}'
            else:
                self.log_icon = f'<i class="fa fa-upload" style="color: red;" data-tooltip="{self.to}"></i> {self.to}'
                parent_doc.location_icon = f'<i class="fa fa-upload" style="color: red;" data-tooltip="{self.to}"></i> {self.to}'

            parent_doc.latest_location = self.to

            if self.tracker_status == "Done":
                parent_doc.status = "Completed"

            parent_doc.save()

        else:
            frappe.throw(_("Document Tracker is not linked via dt_control_number"))