// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Compensatory Time-Off Request", {
// 	refresh(frm) {

frappe.ui.form.on("Compensatory Time-Off Request", "reference_dates", {
    add: function(frm) {
        validate_unique_date(frm);
        sort_child_table(frm);
    },
    remove: function(frm) {
        sort_child_table(frm);
    },
    change: function(frm) {
        validate_unique_date(frm);
        sort_child_table(frm);
    }
});

function sort_child_table(frm) {
    let child_table_field = "reference_dates";
    let sort_field = "date";
    let sort_direction = "asc";

    let child_table = frm.get_field(child_table_field);
    let data = child_table.get_value();

    if (data && data.length > 0) {
        data.sort(function(a, b) {
            let a_val = a[sort_field];
            let b_val = b[sort_field];

            if (sort_direction === "asc") {
                return (a_val > b_val) ? 1 : (a_val < b_val) ? -1 : 0;
            } else { // desc
                return (a_val < b_val) ? 1 : (a_val > b_val) ? -1 : 0;
            }
        });

        child_table.set_value(data);
        frm.fields_dict[child_table_field].grid.refresh();
    }
}

function validate_unique_date(frm) {
    let child_table_field = "reference_dates";
    let date_field = "date";
    let child_table = frm.get_field(child_table_field);
    let data = child_table.get_value();
    let dates = [];
    let has_duplicates = false;

    if (data && data.length > 0) {
        for (let i = 0; i < data.length; i++) {
            let current_date = data[i][date_field];
            if (current_date) {
                if (dates.includes(current_date)) {
                    has_duplicates = true;
                    frappe.msgprint(__("Duplicate date found. Please enter unique dates."));
                    data.splice(i, 1);
                    child_table.set_value(data);
                    frm.fields_dict[child_table_field].grid.refresh();
                    break;
                } else {
                    dates.push(current_date);
                }
            }
        }

        if (has_duplicates) {
            frm.set_flag_as_dirty();
        }
    }
}

frappe.ui.form.on("Compensatory Time-Off Request", "refresh", function(frm) {
    sort_child_table(frm);
    validate_unique_date(frm);

    setTimeout(() => {
        if (frm.fields_dict && frm.fields_dict.reference_dates && frm.fields_dict.reference_dates.grid) {
            validate_unique_date(frm);
        }
    }, 0);
});

frappe.ui.form.on("Compensatory Time-Off Request", {
    reference_dates_on_grid_data_change: function(frm) {
        calculate_total_hours(frm);
    },
    refresh: function(frm) {
        calculate_total_hours(frm);
        // Force plain number display for the hours column
        if (frm.doc.reference_dates) {
            frm.doc.reference_dates.forEach(row => {
                if (row.hours) {
                    row.hours = parseFloat(row.hours).toFixed(2); // Adjust decimal places as needed
                }
            });
            frm.fields_dict.reference_dates.grid.refresh();
        }
    }
});

function calculate_total_hours(frm) {
    let totalHours = 0;
    if (frm.doc.reference_dates) {
        frm.doc.reference_dates.forEach(row => {
            if (row.hours) {
                totalHours += parseFloat(row.hours);
            }
        });
    }
    frm.set_value("total_hours", totalHours);
}

// frappe.ui.form.on('Compensatory Time-Off Request', {
//     refresh: function (frm) {
//         frm.set_query("reference", "reference_dates", function (doc, cdt, cdn) {
//             return {
//                 filters: {
//                     "employee_name": frm.doc.name_of_the_requester
//                 },
//             };
//         });
//     }
// });

frappe.ui.form.on('Compensatory Time-Off Request', {
    refresh: function (frm) {
        frm.set_query("reference", "reference_dates", function (doc, cdt, cdn) {
            return {
                filters: [
                    ["employee", "=", frm.doc.name_of_the_requester],
                    ["status", "!=", "Consumed"]
                ]
            };
        });
    }
});
