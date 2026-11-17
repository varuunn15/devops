// const returnValue = <P>(param: P) => {
//     return param
// }


// let value = returnValue("pol")
// console.log(typeof value)

//enum
enum LoginStatus {
    SUCCESS = "success",
    FAILED = "failed",
    LOADING = "loading"
}

function login(status: LoginStatus): void {

    if (status === LoginStatus.SUCCESS) {
        console.log("Login successful");
    }
    else if (status === LoginStatus.FAILED) {
        console.log("Login failed");
    }
    else {
        console.log("Please wait...");
    }
}

login(LoginStatus.SUCCESS);
console.log(userRole); // ADMIN

