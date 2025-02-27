// Copyright (c) 2025, Lanz Martinez and contributors
// For license information, please see license.txt

// frappe.ui.form.on("Compensatory Time-Off Request", {
// 	refresh(frm) {

// 	},
// });
// frappe.ui.form.on("Compensatory Time-Off Request", "reference_dates", {
//     add: function(frm) {
//         sort_child_table(frm);
//     },
//     remove: function(frm) {
//         sort_child_table(frm);
//     },
//     change: function(frm) {
//         sort_child_table(frm);
//     }
// });

// function sort_child_table(frm) {
//     let child_table_field = "reference_dates";
//     let sort_field = "date"; // Assuming you want to sort by the 'date' field in the child table
//     let sort_direction = "asc"; // "asc" or "desc"

//     let child_table = frm.get_field(child_table_field);
//     let data = child_table.get_value();

//     if (data && data.length > 0) {
//         data.sort(function(a, b) {
//             let a_val = a[sort_field];
//             let b_val = b[sort_field];

//             if (sort_direction === "asc") {
//                 return (a_val > b_val) ? 1 : (a_val < b_val) ? -1 : 0;
//             } else { // desc
//                 return (a_val < b_val) ? 1 : (a_val > b_val) ? -1 : 0;
//             }
//         });

//         child_table.set_value(data);
//         frm.fields_dict[child_table_field].grid.refresh();
//     }
// }

// frappe.ui.form.on("Compensatory Time-Off Request", "refresh", function(frm){
//     sort_child_table(frm);
// });





// last config
// frappe.ui.form.on("Compensatory Time-Off Request", "reference_dates", {
//     add: function(frm) {
//         validate_unique_date(frm); // Call validation after adding
//         sort_child_table(frm);
//     },
//     remove: function(frm) {
//         sort_child_table(frm);
//     },
//     change: function(frm) {
//         validate_unique_date(frm); // Call validation after changing
//         sort_child_table(frm);
//     }
// });

// function validate_unique_date(frm) {
//     let child_table_field = "reference_dates";
//     let date_field = "date"; // The name of your date field
//     let child_table = frm.get_field(child_table_field);
//     let data = child_table.get_value();
//     let dates = [];
//     let has_duplicates = false;

//     if (data && data.length > 0) {
//         for (let i = 0; i < data.length; i++) {
//             let current_date = data[i][date_field];
//             if (current_date) { // Check if the date field is not empty
//                 if (dates.includes(current_date)) {
//                     has_duplicates = true;
//                     frappe.msgprint(__("Duplicate date found. Please enter unique dates."));
//                     // Optionally, you can remove the duplicate entry:
//                     data.splice(i, 1); // Remove the current row (the duplicate)
//                     child_table.set_value(data);
//                     frm.fields_dict[child_table_field].grid.refresh();
//                     break; // Exit the loop after finding the first duplicate
//                 } else {
//                     dates.push(current_date);
//                 }
//             }
//         }

//         if (has_duplicates) {
//           // Prevent form submission if duplicates are found.
//           frm.set_flag_as_dirty(); // Mark the form as dirty to prevent accidental save.
//         }
//     }
// }


// function sort_child_table(frm) {
//     // ... (Your existing sort_child_table function remains the same)
//     let child_table_field = "reference_dates";
//     let sort_field = "date";
//     let sort_direction = "asc"; 

//     let child_table = frm.get_field(child_table_field);
//     let data = child_table.get_value();

//     if (data && data.length > 0) {
//         data.sort(function(a, b) {
//             let a_val = a[sort_field];
//             let b_val = b[sort_field];

//             if (sort_direction === "asc") {
//                 return (a_val > b_val) ? 1 : (a_val < b_val) ? -1 : 0;
//             } else { // desc
//                 return (a_val < b_val) ? 1 : (a_val > b_val) ? -1 : 0;
//             }
//         });

//         child_table.set_value(data);
//         frm.fields_dict[child_table_field].grid.refresh();
//     }
// }

// frappe.ui.form.on("Compensatory Time-Off Request", "refresh", function(frm){
//     sort_child_table(frm);
//     validate_unique_date(frm); // Validate on refresh too
// });


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

frappe.ui.form.on("Compensatory Time-Off Request", "refresh", function(frm){
    sort_child_table(frm);
    validate_unique_date(frm);

    setTimeout(() => {
        if (frm.fields_dict && frm.fields_dict.reference_dates && frm.fields_dict.reference_dates.grid) {
            validate_unique_date(frm);
        }
    }, 0);
});