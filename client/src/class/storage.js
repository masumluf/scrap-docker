import cookie from "js-cookie";
import axios from "axios";

// set in cookie
export const setCookie = (key, value) => {
  if (window !== "undefined") {
    cookie.set(key, value, {
      expires: 1,
    });
  }
};
// remove from cookie
export const removeCookie = (key) => {
  if (window !== "undefined") {
    cookie.remove(key, {
      expires: 1,
    });
  }
};
// get from cookie such as stored token
// will be useful when we need to make request to server with token
export const getCookie = (key) => {
  if (window !== "undefined") {
    return cookie.get(key);
  }
};
// set in localstorage
export const setLocalStorage = (key, value) => {
  if (window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

export const setTagToLocalStorage = (arr) => {
  if (typeof arr === "undefined") {
    //console.log(arr);
    return false;
  }
  let tags = [];
  if (window !== "undefined") {
    if (localStorage.getItem("tag")) {
      tags = JSON.parse(localStorage.getItem("tag"));
      //tags = tags.split(",");
      tags.push(arr);
      //console.log(tags);
      //console.log(arr);
      //JSON.parse();
      //console.log(JSON.parse(JSON.stringify(localStorage.getItem("tag"))));
      //saved values
      localStorage.setItem("tag", JSON.stringify(tags));
      return;
    } else {
      tags.push(arr);
      localStorage.setItem("tag", JSON.stringify(tags));
      return;
    }

    //localStorage.setItem("tag", arr);
  }
};
// remove from localstorage
export const removeLocalStorage = (key) => {
  if (window !== "undefined") {
    localStorage.removeItem(key);
  }
};
// authenticate user by passing data to cookie and localstorage during signin
export const authenticate = (response, next) => {
  //console.log('AUTHENTICATE HELPER ON SIGNIN RESPONSE', response);
  setCookie("token", response.data.token);
  setLocalStorage("user", response.data.user);
  next();
};
// access user info from localstorage
export const isAuth = () => {
  if (typeof window !== "undefined") {
    const cookieChecked = getCookie("token");
    if (cookieChecked) {
      if (localStorage.getItem("user")) {
        return JSON.parse(localStorage.getItem("user"));
      } else {
        return false;
      }
    }
  }
};

export const getTag = () => {
  if (typeof window !== "undefined") {
    if (localStorage.getItem("tag")) {
      return localStorage.getItem("tag");
    } else {
      return false;
    }
  }
};

export const removeOnline = async () => {
  const id = isAuth()._id;

  if (!id) {
    return false;
  }

  try {
    let result = await axios({
      method: "DELETE",
      url: `${process.env.REACT_APP_API_URL}/remove-online-user`,
      data: { id },
    });

    return true;
  } catch (e) {
    console.log(e);
    return false;
  }
};

export const signout = (next) => {
  removeOnline();
  removeCookie("token");
  removeLocalStorage("user");
  next();
};
