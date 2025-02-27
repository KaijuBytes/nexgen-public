# Copyright (c) 2015, Frappe Technologies Pvt. Ltd. and Contributors
# See license.txt

import frappe
from frappe.tests import IntegrationTestCase

from nex.human_resources.doctype.training_event.test_training_event import (
	create_training_event,
	create_training_program,
)


class TestTrainingFeedback(IntegrationTestCase):

	def test_employee_validations_for_feedback(self):
		training_event = create_training_event(self.attendees)
		training_event.submit()

		training_event.event_status = "Completed"
		training_event.save()
		training_event.reload()

		# should not allow creating feedback since employee2 was not part of the event
		feedback = create_training_feedback(training_event.name, self.employee2)
		self.assertRaises(frappe.ValidationError, feedback.save)

		# cannot record feedback for absent employee
		employee = frappe.db.get_value(
			"Training Event Employee", {"parent": training_event.name, "employee": self.employee}, "name"
		)

		frappe.db.set_value("Training Event Employee", employee, "attendance", "Absent")
		feedback = create_training_feedback(training_event.name, self.employee)
		self.assertRaises(frappe.ValidationError, feedback.save)

	def test_training_feedback_status(self):
		training_event = create_training_event(self.attendees)
		training_event.submit()

		training_event.event_status = "Completed"
		training_event.save()
		training_event.reload()

		feedback = create_training_feedback(training_event.name, self.employee)
		feedback.submit()

		status = frappe.db.get_value(
			"Training Event Employee", {"parent": training_event.name, "employee": self.employee}, "status"
		)

		self.assertEqual(status, "Feedback Submitted")

	def tearDown(self):
		frappe.db.rollback()


def create_training_feedback(event, employee):
	return frappe.get_doc(
		{
			"doctype": "Training Feedback",
			"training_event": event,
			"employee": employee,
			"feedback": "Test",
		}
	)
