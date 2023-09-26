const { SOCIALS_SERVICE_SECRET } = process.env;
if (!SOCIALS_SERVICE_SECRET) {
    console.error("Missing required app configuration");
    process.exit(1);
}

const BASE_URL = process.env.SOCIAL_SERVICE_URL ? process.env.SOCIAL_SERVICE_URL : "http://localhost:3002/services/socials/api"

const getPublicKey = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const id = req.params.id
        const body = JSON.stringify({userId});
        const response = await fetch(`${BASE_URL}/public-key/of/${id}`,{
            method:"POST",
            body,
            headers: {
                "Content-Type": "application/json",
                "x-service-secret": SOCIALS_SERVICE_SECRET
            }
        });
        if(response.ok){
            const json = await response.json();
            return res.json({publicKey: json.publicKey});
        }else{
            throw new Error(await response.json());
        }
    } catch (error) {
        console.error(error);
        res.status(400).json(error);
    }
}

const setPublicKey = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const {publicKey} = req.body;
        const body = JSON.stringify({publicKey, userId});
        const response = await fetch(`${BASE_URL}/public-key`, {
            method: "POST",
            body,
            headers: {
                "Content-Type": "application/json",
                "x-service-secret": SOCIALS_SERVICE_SECRET,
            }
        });
        if(response.ok){
            res.status(204).json({});
        }else{
            throw new Error(await response.json());
        }
    } catch (error) {
        console.error(error);
        res.status(400).json(error);
    }
}

module.exports = {
    getPublicKey,
    setPublicKey,
}