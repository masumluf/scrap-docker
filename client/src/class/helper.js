import axios from "axios";
import { authenticate, isAuth } from "./storage";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import { ToastContainer, toast } from "material-react-toastify";
// import "material-react-toastify/dist/ReactToastify.css";
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
const source = axios.CancelToken.source();
const controller = new AbortController();
const { signal } = controller;
const myEnv = dotenv.config();
dotenvExpand(myEnv);

toast.configure();

export const signIn = async (e, values, setValues) => {
  e.preventDefault();

  let { username, password, ip } = values;
  setValues({ ...values, buttonText: "Login.." });

  try {
    let result = await axios({
      method: "POST",
      url: `${process.env.REACT_APP_API_URL}/login`,
      data: { username, password, ip },
    });
    if (result) {
      authenticate(result, () => {
        toast.success(result.data.message);
        setValues({ ...values, buttonText: "SIGN IN" });
        isAuth() && isAuth().role === "admin"
          ? (window.location.href = "/auth/admin")
          : (window.location.href = "/auth/dashboard");
      });
    }
  } catch (e) {
    //console.log(e.response.data.message);
    if (!e.response.data.message === "Wrong Credentials") {
      toast.error("Server Busy");
      return setValues({ ...values, buttonText: "SIGN IN" });
    } else if (e.response.data.message === "Geo Location Security Error") {
      toast.error("Geo Location Security Error");
      return setValues({ ...values, buttonText: "SIGN IN" });
    } else {
      toast.error("Wrong Credentials");
      return setValues({ ...values, buttonText: "SIGN IN" });
    }

    //toast.error(e.response.data.message);
  }
};

export const checkFileSize = (event) => {
  let files = event.target.files;
  let size = 1000000;
  let err = "";
  for (var x = 0; x < files.length; x++) {
    if (files[x].size > size) {
      //err += files[x].type + "is too large, please pick a smaller file\n";
      return false;
    }
  }
  if (err !== "") {
    event.target.value = null;
    console.log(err);
    return false;
  }

  return true;
};

export const checkMimeType = (event) => {
  //getting file object

  let files = event.target.files;
  //console.log(files);

  //define message container
  let err = "";
  // list allow mime type
  const types = ["image/png", "image/jpeg", "image/gif"];
  // loop access array
  for (let x = 0; x < files.length; x++) {
    // compare file type find doesn't matach
    if (types.every((type) => files[x].type !== type)) {
      // create error message and assign to container
      err += files[x].type + " is not a supported format\n";
      toast.error("Wrong File Extension. Only Image allowed.");
      return false;
    }
  }

  if (err !== "") {
    // if message not same old that mean has error
    event.target.value = null; // discard selected file
    toast.error("Error Found.");
    console.log(err);
    return false;
  }
  return true;
};

export const UserReg = async (e, values, setValues) => {
  e.preventDefault();

  let {
    username,
    password,
    name,
    phone,
    age,
    address,
    area,
    gender,
    photo,
    join,
  } = values;

  let datas = new FormData();
  datas.append("username", username);
  datas.append("password", password);
  datas.append("name", name);
  datas.append("phone", phone);
  datas.append("age", age);
  datas.append("address", address);
  datas.append("area", area);
  datas.append("gender", gender);
  datas.append("join", join);
  datas.append("file", photo);
  //const token = getCookie("token");
  //console.log(token);

  try {
    const config = {
      headers: { "content-Type": "multipart/Form-data" },
    };

    let result = await axios.post(
      `${process.env.REACT_APP_API_URL}/user-reg`,
      datas,
      config
    );

    if (result) {
      setValues({
        ...values,
        username: "",
        password: "",
        name: "",
        phone: "",
        age: "",
        address: "",
        user: "",
        gender: "",
        photo: "",
        area: "",
        join: "",
        buttonText: "Submit",
      });
      toast.success("User Successfully Created.");
      return;
    }
  } catch (err) {
    toast.error("Sorry Failed to add");
    return;
  }
};

export const addUrl = async (e, values, setValues) => {
  e.preventDefault();

  let { url, type, buttonText } = values;
  setValues({ ...values, buttonText: "Login.." });

  try {
    let result = await axios({
      method: "POST",
      url: `${process.env.REACT_APP_API_URL}/add-url`,
      data: { url, type },
    });
    if (result) {
      toast.success("Site Successfully Added");
      setValues({
        ...values,
        loader: false,
        url: "",
        type: "",
      });
      return true;
    }
  } catch (e) {
    //console.log(e.response.data.message);
    toast.error("Failed To Add");
    setValues({
      ...values,
      loader: false,
      errors: e.response.data,
    });
    return false;

    //toast.error(e.response.data.message);
  }
};

export const allUrl = async () => {
  try {
    let result = await axios({
      method: "GET",
      url: `${process.env.REACT_APP_API_URL}/all-url`,
    });
    if (result) {
      return result.data;
    }
  } catch (e) {
    toast.error("Failed to fetch Data");
    return [];
  }
};

export const updateUrl = async (e, values, setValues) => {
  e.preventDefault();
  let { _id, url, type } = values;
  try {
    if (!_id) return false;

    let result = await axios({
      method: "PUT",
      url: `${process.env.REACT_APP_API_URL}/update-url`,
      data: { _id, url, type },
    });
    if (result) {
      toast.info("Data Successfully Updated");
      setValues({
        ...values,
        url: "",
        type: "",
      });
      return true;
    }
  } catch (e) {
    toast.error("Failed to Update");
    return false;
  }
};

export const deleteUrl = async (e, _id) => {
  e.preventDefault();
  try {
    let result = await axios({
      method: "DELETE",
      url: `${process.env.REACT_APP_API_URL}/delete-url`,
      data: {
        _id,
      },
    });
    toast.success("Successfully Deleted");
    return true;
  } catch (e) {
    toast.error("Failed to Delete");
    return false;
  }
};

export const searchHistory = async (values, setValues) => {
  let { date1, date2, buttonText } = values;
  //setValues({ ...values, buttonText: "Searching.." });
  console.log(date1, date2);
  try {
    let output = await axios({
      method: "POST",
      url: `${process.env.REACT_APP_API_URL}/data-history`,
      data: { date1, date2 },
    });
    if (output) {
      //console.log(output.data);
      return output.data;
    }
  } catch (e) {
    console.log(e);
    toast.error("Failed To Add");

    return [];

    //toast.error(e.response.data.message);
  }
};

export const allRecord = async () => {
  try {
    let result = await axios({
      method: "GET",
      url: `${process.env.REACT_APP_API_URL}/all-record`,
    });
    if (result) {
      return result.data;
    }
  } catch (e) {
    toast.error("Failed to fetch Data");
    return [];
  }
};

export const searchRecord = async (values, setValues) => {
  let { date1, date2, buttonText } = values;
  //setValues({ ...values, buttonText: "Searching.." });
  console.log(date1, date2);
  try {
    let output = await axios({
      method: "POST",
      url: `${process.env.REACT_APP_API_URL}/search-record`,
      data: { date1, date2 },
    });
    if (output) {
      //console.log(output.data);
      return output.data;
    }
  } catch (e) {
    console.log(e);
    toast.error("Failed To Add");

    return [];

    //toast.error(e.response.data.message);
  }
};

export const recordHistory = async (values, setValues) => {
  let { date1, date2, buttonText } = values;
  //setValues({ ...values, buttonText: "Searching.." });
  console.log(date1, date2);
  try {
    let output = await axios({
      method: "POST",
      url: `${process.env.REACT_APP_API_URL}/history`,
      data: { date1, date2 },
    });
    if (output) {
      //console.log(output.data);
      return output.data;
    }
  } catch (e) {
    console.log(e);
    toast.error("Failed To Add");

    return [];

    //toast.error(e.response.data.message);
  }
};

export const dashboardManagment = async () => {
  try {
    let output = await axios({
      method: "GET",
      url: `${process.env.REACT_APP_API_URL}/dashboard`,
    });
    return output.data ?? {};
  } catch (e) {
    console.log(e);
    toast.error("Failed To Fetch");

    return {};

    //toast.error(e.response.data.message);
  }
};

export const startFetchingData = async (finalUrl) => {
  try {
    // let output = await axios({
    //   method: "GET",
    //   url: `${process.env.REACT_APP_API_URL}/${finalUrl}`,{
    //   cancelToken: ourRequest.token
    // }
    // });

    let output = await fetch(`${process.env.REACT_APP_API_URL}/${finalUrl}`, {
      signal, // <-- 2nd step
    });
    if (output) {
      //console.log(output.data);
      toast.success("Data Scrapping Done");
      return true;
    }
  } catch (e) {
    console.log(e);
    toast.error("Failed To Fetch");

    return false;

    //toast.error(e.response.data.message);
  }
};

export const disableExecutation = async () => {
  console.log("stop api call");
  controller.abort();
  // try {
  //   // let output = await axios({
  //   //   method: "GET",
  //   //   url: `${process.env.REACT_APP_API_URL}/stop`,
  //   // });
  //
  //   let output = await axios.post(
  //     `${process.env.REACT_APP_API_URL}/stop`,
  //     {
  //       name: "new name",
  //     },
  //     {
  //       cancelToken: source.token,
  //     }
  //   );
  //   source.cancel("Operation canceled by the user.");
  //   toast.success("Process Has Been Stopped");
  //   return true;
  // } catch (e) {
  //   console.log(e);
  //   toast.error("Failed To Fetch");
  //
  //   return false;

  //toast.error(e.response.data.message);
  // }
};

export const startFetchingOldData = async (url, topicName) => {
  let regex = /(?:https?:\/\/)?(?:www\.)?(.*)\.(?=[\w.]{1})/;
  let matches = regex.exec(url);
  let finalUrl = matches[1];

  console.log(finalUrl, topicName);
  try {
    let output = await axios({
      method: "POST",
      url: `${process.env.REACT_APP_API_URL}/${finalUrl}/old`,
      data: { topicName },
    });
    if (output) {
      //console.log(output.data);
      return true;
    }
  } catch (e) {
    console.log(e);
    toast.error("Failed To Add");

    //toast.error(e.response.data.message);
  }
};
