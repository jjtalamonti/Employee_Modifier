const inquirer = require("inquirer");
const mysql = require("mysql2");
const fs = require("fs");
const consoleTable = require("console.table");
const util = require("util");
require('dotenv').config();

const db = mysql.createConnection(
    {
        host: 'localhost',
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        user: process.env.DB_USER
    },
    console.log(`Connected to the business database.`)
);


const query = util.promisify(db.query).bind(db);


firstPrompt();

function firstPrompt() {
    inquirer.prompt([{
        name: "firstPrompt",
        type: "list",
        message: "How can I help you?",
        choices: [
            "View all employees",
            "Add employee",
            "Update employee role",
            "View all roles",
            "Add role",
            "View all departments",
            "Add Department",
            // "View Total Utilized Budget By Department",
            "End",
        ]
    },
    ])
        .then((response) => {
            switch (response.firstPrompt) {
                case "View all employees":
                    employeeList();
                    break;
                case "Add employee":
                    addEmployee();
                    break;
                case "Update employee role":
                    updateRole();
                    break;
                case "View all roles":
                    roleList();
                    break;
                case "Add role":
                    addRole();
                    break;
                case "View all departments":
                    departmentList();
                    break;
                case "Add Department":
                    AddDepartment();
                    break;
                // case "View Total Utilized Budget By Department": await budget();
                case "End":
                    db.end();
                    console.log(
                        "\n You have left employee management. Thank you!\n"
                    );
                    return;
                default:
                    break;
            }
        });

}


const employeeList = async () => {
    try {
        const res = await query(
            `SELECT employee.id AS 'id', 
        employee.first_name, 
        employee.last_name, 
        role.title, 
        department.department_name AS 'department', 
        role.salary, 
        CONCAT (manager.first_name,' ', manager.last_name) AS 'manager name'
        FROM employee JOIN role ON role.id = employee.role_id 
        JOIN department ON department.id = role.department_id 
        LEFT JOIN employee AS manager ON employee.manager_id = manager.id 
        ORDER BY employee.id ASC`
        );
        console.table("\n", res, "\n");
        firstPrompt();
    } catch (err) {
        console.error(err);
    }
};


const addEmployee = async () => {
    try {
        const res = await query(`SELECT * FROM role`);

        let roleList = res.map((role) => ({
            name: role.title,
            value: role.id,
        }));

        const boss = await query(`SELECT * FROM employee`);

        let managerList = boss.map((employee) => ({
            name: `${employee.first_name} ${employee.last_name}`,
            value: employee.id,
        }));
        const answers = await inquirer.prompt([
            {
                name: "first_name",
                type: "input",
                message: "Employee's first name?",
            },
            {
                name: "last_name",
                type: "input",
                message: "Employee's last name?",
            },
            {
                name: "employeeRole",
                type: "list",
                message: "Employee's role?",
                choices: roleList,
            },
            {
                name: "employeeManager",
                type: "list",
                message: "Employee's manager?",
                choices: managerList,
            },
        ]);
        const response = await query(`INSERT INTO employee SET ?`, {
            first_name: answers.first_name,
            last_name: answers.last_name,
            role_id: answers.employeeRole,
            manager_id: answers.employeeManager,
        });
        console.log(`\n ${answers.last_name} added to database \n`);
        firstPrompt();
    } catch (err) {
        console.error(err);
    }
};

const updateRole = async () => {
    try {
        const res = await query(`SELECT * FROM role`);

        let roleList = res.map((role) => ({
            name: role.title,
            value: role.id,
        }));
        const find = await query(`SELECT * FROM employee`);

        let list = find.map((employee) => ({
            name: `${employee.first_name} ${employee.last_name}`,
            value: employee.id,
        }));
        const answers = await inquirer.prompt([
            {
                name: "employeeList",
                type: "list",
                message: "Pick the employee you who's role has changed?",
                choices: list,
            },
            {
                name: "newEmployeeRole",
                type: "list",
                message: "What is the Employee's new role?",
                choices: roleList,
            },
        ]);
        const response = await query(
            `UPDATE employee SET role_id = ${answers.newEmployeeRole} WHERE employee.id = ${answers.employeeList}`
        );
        console.log(`\n update successful!\n`);
        firstPrompt();
    } catch (err) {
        console.error(err);
    }
};

const roleList = async () => {
    try {
        const res = await query(
            `SELECT role.id AS 'id', 
        role.title, 
        role.salary, 
        department.department_name AS 'department' 
        FROM role JOIN department 
        ON role.department_id = department.id 
        ORDER BY role.id ASC`
        );
        console.table("\n", res, "\n");
        firstPrompt();
    } catch (err) {
        console.error(err);
    }
};


const addRole = async () => {
    try {
        const res = await query(`SELECT * FROM department`);

        let departmentFinder = res.map((department) => ({
            name: department.name,
            value: department.id,
        }));
        const answers = await inquirer.prompt([
            {
                name: "title",
                type: "input",
                message: "What is the role?",
            },
            {
                name: "salary",
                type: "input",
                message: "What is the role's salary?",
            },
            {
                name: "departmentName",
                type: "list",
                message: "Which department is the role in?",
                choices: departmentFinder,
            },
        ]);
        const response = await query(`INSERT INTO role SET ?`, {
            title: answers.title,
            salary: answers.salary,
            department_id: answers.departmentName,
        });
        console.log(`\n ${answers.title} successfully added to database! \n`);
        firstPrompt();
    } catch (err) {
        console.error(err);
    }
};

const departmentList = async () => {
    try {
        const res = await query(`SELECT* FROM department ORDER BY id ASC`);
        console.table("\n", res, "\n");
        firstPrompt();
    } catch (error) {
        console.error(err);
    }
};



const AddDepartment = async () => {
    const answers = await inquirer.prompt([
        {
            type: "input",
            message: "What is the name of the new department?",
            name: "newDepartment",
        },
    ]);
    try {
        const response = await query(`INSERT INTO department SET ?`, {
            department_name: answers.newDepartment,
        });
        console.log(`\n ${answers.newDepartment} added to database! \n`);
        firstPrompt();
    } catch (error) {
        console.error(err);
    }
}
// const budget = async () => {
//     const choiceArr = await departmentList();
//     choiceArr.unshift("All");
//     const answers = await inquirer.prompt([
//         {
//             type: "list",
//             message: "Which department would you like to see Total Utilized Budget for?",
//             choices: arr,
//             name: "departmentPicked"
//         },
//     ]);
//     if (answers.departmentPicked === "All") {
//         const budgetTable = await query('SELECT department.id, department.department_name, SUM(role.salary) AS `utilized_budget` From department JOIN role on role.department_id = department.id JOIN employee on role.id = employee.role_id GROUP BY role.department_id;');
//         console.table(budgetTable);
//     } else {
//         const result = await query('SELECT id,department_name FROM department GROUP BY id ORDER BY id;');
//         const getDepartmentId = result.fin((item => item.department_name === answers.departmentPicked))
//         const empolyeeDepartment = await query(`SELECT department.id, department.department_name, SUM(role.salary) AS "utilized_budget" From department JOIN role on role.department_id = department.id JOIN employee on role.id = employee.role_id WHERE department_id = ${getDepartmentId.id} GROUP BY role.department_id;`);
//         console.table(empolyeeDepartment);

//     }
//     firstPrompt();
// } catch (err) {
//     console.log(err);
// }
