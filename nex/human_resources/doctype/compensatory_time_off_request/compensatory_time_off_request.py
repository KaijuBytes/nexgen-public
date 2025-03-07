# Copyright (c) 2025, Lanz Martinez and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class CompensatoryTimeOffRequest(Document):

    def validate(self):
        """Runs before saving. Ensures data consistency."""
        self.calculate_total_hours()
        self.validate_cto_hours()

    def calculate_total_hours(self):
        """Ensure all hours are converted to float before summing."""
        self.total_hours = sum(float(row.hours or 0) for row in self.reference_dates)

    def validate_cto_hours(self):
        """Ensure cto_hours is valid and does not exceed total_hours."""
        if self.cto_hours is None:
            frappe.throw("CTO Hours is required.")
        
        self.cto_hours = float(self.cto_hours)  # Ensure it's a float
        self.total_hours = float(self.total_hours or 0)  # Default to 0 if None

        if self.cto_hours > self.total_hours:
            frappe.throw("CTO Hours cannot exceed Total Hours.")

    def on_submit(self):
        """Runs when submitting the document. Processes and consumes hours."""
        self.consume_hours()

    def consume_hours(self):
        """Consume hours from reference_dates and update COC Status."""
        remaining_cto_hours = float(self.cto_hours)  # Ensure it's a float

        for row in self.reference_dates:
            if remaining_cto_hours <= 0:
                break  # Stop if we've allocated all requested hours

            row_hours = float(row.hours or 0)  # Convert to float to avoid TypeError
            if row_hours <= 0:
                continue  # Skip if no hours available

            # Fetch the corresponding COC Status document
            coc_status = frappe.get_doc("COC Status", row.reference)

            if remaining_cto_hours >= row_hours:
                # Fully consume this entry
                remaining_cto_hours -= row_hours
                coc_status.status = "Consumed"
                coc_status.available_hours = 0
            else:
                # Partially consume this entry
                coc_status.status = "Partially Available"
                coc_status.available_hours = row_hours - remaining_cto_hours
                remaining_cto_hours = 0  # We've fully allocated cto_hours

            # Save updates to COC Status
            coc_status.save()

        # Do NOT update the submitted document's child table (avoiding "Cannot Update After Submit" error)
