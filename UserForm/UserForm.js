import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Field, Form, Formik } from "formik";
import { Select, TextField } from "formik-material-ui";
import { logOutMutation } from "../../../../redux/auth/authMutations";
import { CustomButton } from "../../../../components/CustomButton";
import { clearTokens } from "../../../../helpers";
import { useHistory } from "react-router-dom";
import { Alert } from "@material-ui/lab";
import {
    companySizes,
    companyTypes,
    positions,
} from "../../../../authPages/SignUpCreateProfile/data";
import {
    MenuItem,
    Snackbar,
} from "@material-ui/core";
import {
    getUserInfo,
    removeUserAvatar,
    updateUserAvatar,
    updateUserInfo,
} from "../../../../redux/auth/authActions";
import largeAvatarDefault from "../../../../assets/images/AvatarDefault.jpg";
import makeStyles from "@material-ui/core/styles/makeStyles";
import googleIcon from "../../../../assets/icons/googleIcon.svg";
import Button from "@material-ui/core/Button";
import "./styles.scss";

const useStyles = makeStyles(() => ({
    upload: {
        border: "1px solid #D74E97",
        color: "#D74E97",
        backgroundColor: "white",
        boxShadow: "none",
        textTransform: "none",
        fontFamily: "Lato",
        fontWeight: "bold",
        fontSize: "17px",
        height: 52,
        width: 195,
        "&:hover": { backgroundColor: "white", boxShadow: "none" },
    },
}));

export const UserBasicInfo = () => {
    const user = useSelector((state) => state.authReducer.userInfo);

    const [avatar, setAvatar] = useState(null);
    const [snackBarOpen, setSnackBarOpen] = useState(false);

    const classes = useStyles();
    const dispatch = useDispatch();

    useEffect(() => dispatch(getUserInfo()), [dispatch]);
    useEffect(() => setAvatar(user.photo), [user.photo]);

    const handleAvatarChange = (e) => {
        setAvatar(e.target.files[0]);
    };

    const handleRemoveAvatar = () => {
        setAvatar(null);
        if (user.photo) {
            dispatch(removeUserAvatar());
        }
    };

    const getAvatar = () => {
        if (!avatar) return largeAvatarDefault;

        if (typeof avatar === "string") return avatar;

        return URL.createObjectURL(avatar);
    };

    const handleSnackClose = (event, reason) => {
        if (reason === "clickaway") {
            return;
        }
        setSnackBarOpen(false);
    };

    return (
        <div className="basic-info">
            <div className="large-avatar">
                <div className="large-avatar__wrap">
                    <img src={getAvatar()} alt="large avatar" />
                </div>
                <div className="large-avatar__buttons">
                    <Button
                        style={{
                            color: "#D74E97",
                            textTransform: "none",
                            fontSize: 16,
                            marginBottom: 10,
                            width: 195,
                            boxSizing: "border-box",
                        }}
                        type="button"
                        onClick={() => {
                            handleRemoveAvatar();
                        }}
                    >
                        Remove current photo
                    </Button>
                    <input
                        accept="image/*"
                        style={{ display: "none" }}
                        className="upload-input"
                        id="contained-button-file"
                        type="file"
                        onChange={handleAvatarChange}
                    />
                    <label htmlFor="contained-button-file" style={{ width: 195 }}>
                        <Button
                            type="button"
                            variant="contained"
                            color="primary"
                            component="span"
                            className={classes.upload}
                        >
                            Upload Photo
                        </Button>
                    </label>
                </div>
            </div>
            <SettingsForm
                activateSnack={setSnackBarOpen}
                user={user}
                avatar={avatar}
            />
            <Snackbar
                open={snackBarOpen}
                autoHideDuration={6000}
                onClose={handleSnackClose}
            >
                <Alert onClose={handleSnackClose} severity="success">
                    Your user data was updated!
                </Alert>
            </Snackbar>

        </div>
    );
};

const SettingsForm = ({user, avatar, activateSnack}) => {
    const dispatch = useDispatch();
    const history = useHistory();

    const logOut = () => {
        clearTokens();
        dispatch(logOutMutation());
        history.push("/login");
    };

    const handleSubmit = (values, avatar) => {
        const formData = new FormData();
        formData.append("photo", avatar);

        if (avatar !== user.photo || null) {
            dispatch(updateUserAvatar(formData));
        }

        dispatch(updateUserInfo(values));
        activateSnack(true);
    };

    const authGoogle = useSelector(
        (state) => state.authReducer.userInfo?.signup === "Google"
    );

    return (
        <Formik
            enableReinitialize
            initialValues={{
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                company_name: user.company_name || "",
                position: user.position || "",
                company_type: user.company_type || "",
                company_size: user.company_size || "",
            }}
            onSubmit={(values, { resetForm }) => {
                handleSubmit(values, avatar);
                resetForm({ values });
            }}
        >
            <Form>
                <>
                    <div className="user-settings__name">
                        <h3>Name</h3>
                        <div className="create-profile__form-fields">
                            <Field
                                name="first_name"
                                component={TextField}
                                label="First Name"
                            />
                            <Field name="last_name" component={TextField} label="Last Name" />
                        </div>
                    </div>
                    <div className="user-settings__email">
                        <h3>Email address</h3>
                        <p>{user.email}</p>
                    </div>
                    {authGoogle ? (
                        <div className="user-settings__password-google">
                            <h3>Social login</h3>
                            <div className="google-icon-text">
                                <img src={googleIcon} alt="google" />
                                <p>Google</p>
                                <p>{user.first_name + " " + user.last_name}</p>
                                <CustomButton
                                    type="button"
                                    handleClick={logOut}
                                    text="Disconnect"
                                    fullWidth
                                    width={195}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="user-settings__password">
                            <h3>Password</h3>
                            <CustomButton
                                text="Reset Password"
                                fullWidth
                                width={175}
                                handleClick={() => history.push("/reset-password")}
                            />
                        </div>
                    )}
                    <div className="user-settings__about-you">
                        <h3>About You</h3>
                        <div className="field-margin">
                            <p>Your company</p>
                            <Field
                                style={{ width: 475 }}
                                name="company_name"
                                component={TextField}
                                label="Company Name"
                            />
                        </div>
                        <div className="field-margin">
                            <p>Role:</p>
                            <Field
                                component={Select}
                                type="text"
                                name="position"
                                style={{ width: 475, marginTop: 15, marginRight: 50 }}
                            >
                                {positions.map((position, index) => {
                                    return (
                                        <MenuItem key={index + "position"} value={position.name}>
                                            {position.name}
                                        </MenuItem>
                                    );
                                })}
                            </Field>
                        </div>
                        <div className="field-margin">
                            <p>Company size:</p>
                            <Field
                                component={Select}
                                placeholder="First Name"
                                type="text"
                                name="company_size"
                                style={{ width: 475, marginTop: 15, marginRight: 50 }}
                            >
                                {companySizes.map((size, index) => {
                                    return (
                                        <MenuItem key={index + "companySize"} value={size.name}>
                                            {size.name}
                                        </MenuItem>
                                    );
                                })}
                            </Field>
                        </div>
                        <div className="field-margin">
                            <p>Company Type</p>
                            <Field
                                component={Select}
                                type="text"
                                name="company_type"
                                style={{ width: 475, marginTop: 15, marginRight: 50 }}
                            >
                                {companyTypes.map((type, index) => {
                                    return (
                                        <MenuItem key={index + "type"} value={type.name}>
                                            {type.name}
                                        </MenuItem>
                                    );
                                })}
                            </Field>
                        </div>
                    </div>
                    <CustomButton submit text="Save" fullWidth width={145} height={50} />
                </>
            </Form>
        </Formik>
    );
};
