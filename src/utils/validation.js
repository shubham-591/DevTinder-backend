const validatingUserData = async (req) => {
    try {
        const allowedFields = ["name", "age", "gender", "photoUrl", "about", "skills"];
        const isAllowed = Object.keys(req.body).every((field) => allowedFields.includes(field));

        return isAllowed;
    } catch (error) {
        
    }   
}

module.exports = validatingUserData;