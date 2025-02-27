# Copyright (c) 2025, Lanz Martinez and contributors
# For license information, please see license.txt

# import frappe
# from frappe.model.document import Document


# class AssetLogs(Document):
# 	pass
# import frappe
# from frappe.model.document import Document
# from frappe import _

# class AssetLogs(Document):
#     def autoname(self):
#         asset_number = self.asset_number
#         if not asset_number:
#             return None  # Or handle the case where asset_number is missing

#         doctype_name = self.doctype

#         # Find the latest sequence number for this asset_number
#         latest_doc = frappe.db.sql(
#             """
#             SELECT name
#             FROM "tabAsset Logs"
#             WHERE asset_number = %s AND name LIKE %s
#             ORDER BY name DESC
#             LIMIT 1
#             """,
#             (asset_number, f"%{asset_number}-LOG-%"),
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

#         self.name = f"{asset_number}-LOG-{new_sequence:03d}"

# Copyright (c) 2025, Lanz Martinez and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe import _

class AssetLogs(Document):
    def autoname(self):
        asset_number = self.asset_number
        if not asset_number:
            return None

        latest_doc = frappe.db.sql(
            """
            SELECT name
            FROM "tabAsset Logs"
            WHERE asset_number = %s AND name LIKE %s
            ORDER BY name DESC
            LIMIT 1
            """,
            (asset_number, f"%{asset_number}-LOG-%"),
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

        self.name = f"{asset_number}-LOG-{new_sequence:03d}"

    def on_submit(self):
        """
        Update Asset location and status based on log type.
        """
        if self.asset_number:
            asset = frappe.get_doc("Asset", self.asset_number)
            asset.asset_location = self.location_update
            asset.asset_location_details = self.location_details_update

            if self.type_of_log == "Gatepass Out":
                asset.status = "Gatepass Out"
            elif self.type_of_log == "Gatepass In":
                asset.status = "Available"
            elif self.type_of_log == "Maintenance/Repair":
                asset.status = "Under Maintenance"
            elif self.type_of_log == "Surrendered":
                asset.status = "Surrendered"

            asset.save()