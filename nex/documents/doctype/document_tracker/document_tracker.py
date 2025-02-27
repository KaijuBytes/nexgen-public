# Copyright (c) 2025, Lanz Martinez and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class DocumentTracker(Document):
# 	pass

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

    # def customize_document_tracker(self, method):
    #     if self.attachment_method == "Group":
    #         self.set_df_property("single_documents_or_records", "hidden", 1)
    #         self.set_df_property("group_of_documents_or_records", "hidden", 0)
    #     elif self.attachment_method == "Single":
    #         self.set_df_property("single_documents_or_records", "hidden", 0)
    #         self.set_df_property("group_of_documents_or_records", "hidden", 1)
    #     elif self.attachment_method == "Both":
    #         self.set_df_property("single_documents_or_records", "hidden", 0)
    #         self.set_df_property("group_of_documents_or_records", "hidden", 0)
    #     else:
    #         self.set_df_property("single_documents_or_records", "hidden", 0)
    #         self.set_df_property("group_of_documents_or_records", "hidden", 0)

    # def on_load(self):
    #     self.customize_document_tracker(None)

    # def attachment_method_on_change(self):
    #     self.customize_document_tracker(None)