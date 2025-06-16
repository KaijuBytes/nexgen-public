# # import frappe

# # def get_permission_query_conditions_for_Task(user):
# #     """
# #     Restricts Task DocType visibility based on ownership, assignment, or sharing.

# #     Args:
# #         user (str): The user ID (email) of the current logged-in user.

# #     Returns:
# #         str or None: A SQL WHERE clause string to filter tasks, or None if no restriction applies.
# #     """
# #     if not user:
# #         # Fallback to current session user if not provided (though hook typically passes it)
# #         user = frappe.session.user

# #     # Allow Administrator role to see all tasks without restriction
# #     if "Administrator" in frappe.get_roles(user):
# #         return None

# #     # Escape the current user's email. frappe.db.escape() returns the string already quoted.
# #     current_user_email_escaped = frappe.db.escape(user)

# #     # Condition 1: User is the owner of the task
# #     # Embed the escaped string directly without extra quotes.
# #     owner_condition = f"`tabTask`.`owner` = {current_user_email_escaped}"

# #     # Condition 2: User is assigned to the task
# #     # Escape the entire LIKE pattern including wildcards.
# #     assigned_pattern_escaped = frappe.db.escape(f"%{user}%")
# #     # Embed the escaped pattern directly without extra quotes.
# #     assigned_condition = f"`tabTask`._assign LIKE {assigned_pattern_escaped}"

# #     # Condition 3: Task is explicitly shared with the user
# #     # Embed the escaped string directly without extra quotes.
# #     shared_condition = (
# #         f"`tabTask`.`name` IN ("
# #         f"SELECT `name` FROM `tabDocShare` "
# #         f"WHERE `share_doctype` = 'Task' AND `user` = {current_user_email_escaped}"
# #         f")"
# #     )

# #     # Combine all three conditions using logical OR
# #     # A task will be visible if ANY of these conditions are met.
# #     combined_conditions = f"({owner_condition} OR {assigned_condition} OR {shared_condition})"

# #     return combined_conditions

# import frappe

# def get_permission_query_conditions_for_Task(user):
#     """
#     Restricts Task DocType visibility based on ownership, assignment, or sharing.

#     Args:
#         user (str): The user ID (email) of the current logged-in user.

#     Returns:
#         str or None: A SQL WHERE clause string to filter tasks, or None if no restriction applies.
#     """
#     if not user:
#         # Fallback to current session user if not provided (though hook typically passes it)
#         user = frappe.session.user

#     # Allow Administrator role to see all tasks without restriction
#     if "Administrator" in frappe.get_roles(user):
#         return None

#     # Escape the current user's email. frappe.db.escape() returns the string already quoted.
#     current_user_email_escaped = frappe.db.escape(user)

#     # Condition 1: User is the owner of the task
#     # Embed the escaped string directly without extra quotes.
#     owner_condition = f"`tabTask`.`owner` = {current_user_email_escaped}"

#     # Condition 2: User is assigned to the task
#     # Escape the entire LIKE pattern including wildcards.
#     assigned_pattern_escaped = frappe.db.escape(f"%{user}%")
#     # Embed the escaped pattern directly without extra quotes.
#     assigned_condition = f"`tabTask`._assign LIKE {assigned_pattern_escaped}"

#     # Condition 3: Task is explicitly shared with the user
#     # IMPORTANT: The `tabDocShare` table uses the `share_name` column to store the
#     # name (ID) of the shared document, not the `name` column.
#     # We need to select `share_name` from `tabDocShare` where `share_doctype` is 'Task'
#     # and the `user` is the current logged-in user.
#     shared_condition = (
#         f"`tabTask`.`name` IN ("
#         f"SELECT `share_name` FROM `tabDocShare` "
#         f"WHERE `share_doctype` = 'Task' AND `user` = {current_user_email_escaped}"
#         f")"
#     )

#     # Combine all three conditions using logical OR
#     # A task will be visible if ANY of these conditions are met.
#     combined_conditions = f"({owner_condition} OR {assigned_condition} OR {shared_condition})"

#     return combined_conditions
# import frappe

# def get_permission_query_conditions_for_Task(user):
#     """
#     Restricts Task DocType visibility based on ownership, assignment, or sharing,
#     including visibility of immediate child tasks if the user has access to a parent task.
#     This version avoids using lft/rgt and relies on parent_task field.

#     Args:
#         user (str): The user ID (email) of the current logged-in user.

#     Returns:
#         str or None: A SQL WHERE clause string to filter tasks, or None if no restriction applies.
#     """
#     if not user:
#         # Fallback to current session user if not provided (though hook typically passes it)
#         user = frappe.session.user

#     # Allow Administrator role to see all tasks without restriction
#     if "Administrator" in frappe.get_roles(user):
#         return None

#     # Escape the current user's email. frappe.db.escape() returns the string already quoted.
#     current_user_email_escaped = frappe.db.escape(user)

#     # Escape the entire LIKE pattern including wildcards for assigned condition.
#     assigned_pattern_escaped = frappe.db.escape(f"%{user}%")

#     # Helper function to generate the SQL fragment for direct access conditions
#     # for a given table alias (e.g., 'T' or 'tabTask')
#     def get_direct_access_conditions_sql(alias):
#         return (
#             f"{alias}.`owner` = {current_user_email_escaped} OR "
#             f"{alias}.`_assign` LIKE {assigned_pattern_escaped} OR "
#             f"{alias}.`name` IN ("
#                 f"SELECT `share_name` FROM `tabDocShare` "
#                 f"WHERE `share_doctype` = 'Task' AND `user` = {current_user_email_escaped}"
#             f")"
#         )

#     # Condition 1: User has direct access to the current task (`tabTask`)
#     direct_access_to_current_task = get_direct_access_conditions_sql("`tabTask`")

#     # Condition 2: User has direct access to the immediate parent of the current task.
#     # This involves a subquery to find the names of parent tasks that the user has direct access to.
#     parent_access_subquery = (
#         f"SELECT T_PARENT.`name` FROM `tabTask` AS T_PARENT "
#         f"WHERE {get_direct_access_conditions_sql('T_PARENT')}"
#     )
#     access_via_parent_task = (
#         f"`tabTask`.`parent_task` IS NOT NULL AND "
#         f"`tabTask`.`parent_task` IN ({parent_access_subquery})"
#     )

#     # Combine both conditions: a task is visible if the current user has direct access to it,
#     # OR if the user has direct access to its immediate parent task.
#     combined_conditions = f"({direct_access_to_current_task} OR {access_via_parent_task})"

#     return combined_conditions

import frappe

def get_permission_query_conditions_for_Task(user):
    """
    Restricts Task DocType visibility based on ownership, assignment, or sharing,
    including visibility of all descendant tasks if the user has access to a parent task.
    This implementation leverages the lft and rgt fields for efficient tree traversal.

    Args:
        user (str): The user ID (email) of the current logged-in user.

    Returns:
        str or None: A SQL WHERE clause string to filter tasks, or None if no restriction applies.
    """
    if not user:
        # Fallback to current session user if not provided (though hook typically passes it)
        user = frappe.session.user

    # Allow Administrator role to see all tasks without restriction
    if "Administrator" in frappe.get_roles(user):
        return None

    # Escape the current user's email. frappe.db.escape() returns the string already quoted.
    current_user_email_escaped = frappe.db.escape(user)

    # Escape the entire LIKE pattern including wildcards for assigned condition.
    assigned_pattern_escaped = frappe.db.escape(f"%{user}%")

    # Define the base conditions for direct access to any task (T1):
    # A task (T1) is directly accessible if:
    # 1. The user is the owner of T1.
    # 2. The user is directly assigned to T1.
    # 3. T1 is explicitly shared with the user via tabDocShare.
    base_access_conditions = (
        f"T1.`owner` = {current_user_email_escaped} OR "
        f"T1.`_assign` LIKE {assigned_pattern_escaped} OR "
        f"T1.`name` IN ("
            f"SELECT `share_name` FROM `tabDocShare` "
            f"WHERE `share_doctype` = 'Task' AND `user` = {current_user_email_escaped}"
        f")"
    )

    # Construct a subquery to find all tasks (T2) that should be visible.
    # This subquery works as follows:
    # - It first identifies all tasks (aliased as T1) that the user has direct access to
    #   based on the `base_access_conditions`.
    # - It then joins T1 with all other tasks (aliased as T2) where T2's `lft` and `rgt`
    #   values fall within T1's `lft` and `rgt` range.
    # - This `JOIN` condition (T2.`lft` BETWEEN T1.`lft` AND T1.`rgt`) efficiently
    #   selects T1 itself and all of its descendants (children, grandchildren, etc.).
    visible_tasks_subquery = (
        f"SELECT T2.`name` FROM `tabTask` AS T1 "
        f"JOIN `tabTask` AS T2 ON T2.`lft` BETWEEN T1.`lft` AND T1.`rgt` "
        f"WHERE {base_access_conditions}"
    )

    # The final permission query condition:
    # The current task being evaluated (`tabTask`.`name`) must be present
    # in the list of task names returned by the `visible_tasks_subquery`.
    combined_conditions = f"`tabTask`.`name` IN ({visible_tasks_subquery})"

    return combined_conditions
