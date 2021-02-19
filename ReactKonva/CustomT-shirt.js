import React, { useEffect, useState, useRef } from "react";
import { Redirect, useHistory, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FileUploader } from "./components/FileUploader/FileUploader";
import { IconButton } from "@material-ui/core";
import { Layer, Stage } from "react-konva";
import { encodeImageFileAsURL } from "../../utils/converteImageToBase64";
import { Alert, AlertTitle } from "@material-ui/lab";
import { getTemplateById } from "../../redux/templates/templatesActions";
import { addNewProduct } from "../../redux/products/productsActions";
import { ButtonCreate } from "../../components/ButtonCreate";
import { screenshot } from "../../utils";
import { Preloader } from "../../components/Preloader";
import { Img } from "./Img";
import {
    buildImgProperty,
    dataURLtoFile,
    getRandomString,
    getTemplateImages,
    srcToFile,
} from "../../utils";
import ArrowBackIcon from "@material-ui/icons/ArrowBack";
import "./styles.scss";
/////////////////INPUTS
import TextField from "@material-ui/core/TextField";

const initialRectangles = [];
const coefficientHeight = 6;
const coefficientWidth = 6;
const stageWidth = 600;
const stageHeight = 600;
const imageWidth = 300;
const imageHeight = 300;

export const CustomizeProductPage = () => {
    const dispatch = useDispatch();
    const history = useHistory();
    const params = useParams();
    const canvasRef = useRef();

    const [rectangles, setRectangles] = useState(initialRectangles);
    const [selectedId, selectShape] = useState(null);
    const [idCount, setIdCount] = useState(0);
    const [files, setFiles] = useState([]);
    const [hidePrintArea, setHidePrintArea] = useState(false);
    const [mainImage, setMainImage] = useState(null);
    const [open, setOpen] = useState(false);
    const [completeImages, setCompleteImages] = useState({});
    const [detailInfoFiles, setDetailInfoFiles] = useState({});
    const [isSendData, setIsSendData] = useState(false);
    const [errors, setErrors] = useState({});
    const [globalError, setGlobalError] = useState(
        "You need to upload at least one image"
    );

    const [formValues, setFormValues] = useState({
        name: "",
        price: "",
        description: "",
        images: [],
    });

    const template = useSelector((state) => state.templatesReducer.template);
    const isLoading = useSelector((state) => state.commonReducer.isFetching);

    const { name, price, description } = formValues;
    const { front, back } = getTemplateImages(template);


    const handleImageLoaded = (imgUrl) => {
        const newImg = buildImgProperty(
            imgUrl,
            mainImage,
            imageWidth,
            imageHeight,
            idCount,
            setIdCount
        );
        setRectangles([...rectangles, newImg]);
        setTimeout(() => {
            screenshot(mainImage, setCompleteImages);
        }, 100);
        setGlobalError("");
    };

    const checkDeselect = (e) => {
        const clickedOnEmpty = e.target === e.target.getStage();
        if (clickedOnEmpty) {
            selectShape(null);
        }
    };

    const setOriginalImage = (side) => (image) => {
        setCompleteImages((prevState) => ({ ...prevState, [side]: image }));
    };

    const checkAvailableImages = () => {
        template.images.forEach((image) => {
            if (!completeImages[image.side]) {
                srcToFile(image.path, getRandomString(20)).then((file) => {
                    const imgInBase64 = encodeImageFileAsURL(
                        file,
                        setOriginalImage(image.side)
                    );
                    if (imgInBase64)
                        setCompleteImages((prevState) => ({
                            ...prevState,
                            [image]: imgInBase64,
                        }));
                });
            }
        });
    };

    const openModal = () => {
        selectShape(null);
        setHidePrintArea(true);
        checkAvailableImages();
        setOpen(true);
    };

    const closeModal = () => {
        setHidePrintArea(false);
        setOpen(false);
    };


    useEffect(() => {
        dispatch(getTemplateById(params.id));
    }, [dispatch, params.id]);

    useEffect(() => {
        setMainImage(template?.images && template?.images[0]);
    }, [template]);

    useEffect(() => {
        const latestUpdatedFile = files[files.length - 1];
        if (latestUpdatedFile) {
            setDetailInfoFiles((prevState) => ({
                ...prevState,
                [mainImage.side]: latestUpdatedFile,
            }));
            setGlobalError("");
        }
    }, [mainImage, files]);



    const rectanglesByImage = rectangles.filter(
        (e) => e.parentId === mainImage._id
    );

    const resetFieldError = (field) => {
        setErrors({ ...errors, [field]: false });
    };

    const isFormValid = () => {
        const errors = {};
        for (const field in formValues) {
            errors[field] = validateField(field);
        }

        setErrors(errors);
        return Object.values(errors).every((e) => !e);
    };

    const validateField = (field) => {
        switch (field) {
            default:
                return !Boolean(formValues[field]);
        }
    };

    const handleChangeInput = (e) => {
        const { name, value } = e.target;
        const values = { ...formValues, [name]: value };

        if (errors[name]) resetFieldError(name);

        setFormValues(values);
    };


    const createFormData = async () => {
        const formData = new FormData();
        let completeImageFront, completeImageBack;
        const { name, price, description } = formValues;
        formData.append("name", name);
        formData.append("template", template._id);
        formData.append("size", template.sizes);
        formData.append("product_type", "t-shirt");
        formData.append("price", price);
        formData.append("description", description);
        if (detailInfoFiles["front"]) {
            formData.append("originals_front", detailInfoFiles["front"]);
        }
        if (detailInfoFiles["back"]) {
            formData.append("originals_back", detailInfoFiles["back"]);
        }
        const toStringUrlImgFront = completeImages["front"];
        const toStringUrlImgBack = completeImages["back"];
        if (toStringUrlImgFront) {
            completeImageFront = await dataURLtoFile(
                toStringUrlImgFront,
                `${getRandomString(20)}.png`
            );
            formData.append("front", completeImageFront);
        }
        if (toStringUrlImgBack) {
            completeImageBack = await dataURLtoFile(
                toStringUrlImgBack,
                `${getRandomString(20)}.png`
            );

            formData.append("back", completeImageBack);
        }
        return formData;
    };

    const submitNewTemplate = async () => {
        closeModal();
        const data = await createFormData();
        dispatch(addNewProduct(data));
        setIsSendData(true);
    };

    const handleFormSubmit = () => {
        if (!isFormValid()) {
            console.log("form is not valid");
            return;
        }
        submitNewTemplate();
    };

    const handleFormReset = () => {
        setFormValues({
            name: "",
            price: "",
            description: "",
            images: [],
        });
        setRectangles([]);
    };

    const onChangeMainImage = (image) => {
        setTimeout(() => {
            setMainImage(image);
        }, 200);
    };


    const styleProps =
        mainImage && mainImage.side === "back"
            ? {
                position: "relative",
                backgroundColor: hidePrintArea ? "transparent" : "rgba(0,0,0, 0.5)",
                top: (back.y || 0) * coefficientHeight,
                left: (back.x || 0) * coefficientWidth,
                width: (back.width || 0) * coefficientWidth,
                height: (back.height || 0) * coefficientHeight,
            }
            : {
                position: "relative",
                backgroundColor: hidePrintArea ? "transparent" : "rgba(0,0,0, 0.5)",
                top: (front.y || 0) * coefficientHeight,
                left: (front.x || 0) * coefficientWidth,
                width: (front.width || 0) * coefficientWidth,
                height: (front.height || 0) * coefficientHeight,
            };

    const lowPriceCheck = price <= template?.manufacturing_cost;

    const isDisabled =
        Object.values(detailInfoFiles).length >= 1 &&
        !lowPriceCheck &&
        name &&
        description;
    if (isSendData && !isLoading) return <Redirect to={"/"} />;

    return !isLoading ? (
        <div className="customize">
            <div className="back-btn">
                <IconButton onClick={() => history.push("/")}>
                    <ArrowBackIcon fontSize="large" style={{ color: "black" }} />
                </IconButton>
            </div>
            <div className="customize__title">Customize Your Product</div>
            <div className="customize__content">
                <div className="customize__menu">
                    <div className="menu">
                        <div className="menu__images">
                            {template.images?.length &&
                            template.images.map((image, index) => {
                                console.log("image", image);
                                return (
                                    <div key={index}>
                                        <div
                                            className={`images__secondary-image ${
                                                mainImage?.side === image.side &&
                                                "images__secondary-image--selected"
                                            }`}
                                        >
                                            <img
                                                data-index={image._id}
                                                src={image.path}
                                                alt="secondary"
                                                onClick={() => onChangeMainImage(image)}
                                            />
                                        </div>
                                        <p style={{ textTransform: "uppercase" }}>{image.side}</p>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="menu__options">
                            <p>Technique of Print :</p>
                            <p>CMYK</p>
                            <h2>Add design</h2>
                            {globalError && <div className={"error"}>{globalError}</div>}
                            <FileUploader
                                files={files}
                                setFiles={setFiles}
                                onImageLoaded={handleImageLoaded}
                            />
                        </div>
                    </div>
                </div>

                <div className="customize__stage stage">
                    <div
                        id="stage-node"
                        className="stage__stage-block"
                        style={{
                            backgroundImage: mainImage
                                ? `url("${mainImage.path}")`
                                : `url("${mainImage}")`,
                            backgroundSize: "contain",
                            backgroundRepeat: "no-repeat",
                            backgroundPosition: "center",
                            width: stageWidth,
                            height: stageHeight,
                            position: "relative",
                        }}
                    >
                        <div className="print-area" style={styleProps}>
                            <Stage
                                width={styleProps.width}
                                height={styleProps.height}
                                onMouseDown={checkDeselect}
                                onTouchStart={checkDeselect}
                                ref={canvasRef}
                                style={{
                                    borderRadius: "5px",
                                    display: "flex",
                                    margin: "0 auto",
                                    cursor: "pointer",
                                }}
                                onDragEnd={() => screenshot(mainImage, setCompleteImages)}
                                onTransformEnd={() => screenshot(mainImage, setCompleteImages)}
                                onTouchEnd={() => screenshot(mainImage, setCompleteImages)}
                                onMouseUp={() => screenshot(mainImage, setCompleteImages)}
                            >
                                {rectanglesByImage.map((rect, i) => {
                                    return (
                                        <Layer key={i + "layer"}>
                                            <Img
                                                imageWidth={imageWidth}
                                                imageHeight={imageHeight}
                                                canvasRef={canvasRef}
                                                shapeProps={rect}
                                                isSelected={rect.id === selectedId}
                                                onSelect={() => {
                                                    selectShape(rect.id);
                                                }}
                                                width={stageWidth}
                                                height={stageHeight}
                                                onChange={(newAttrs) => {
                                                    const rects = rectangles.slice();
                                                    const rectIndex = rects.findIndex(
                                                        (e) => newAttrs.id === e.id
                                                    );
                                                    rects[rectIndex] = newAttrs;
                                                    setRectangles(rects);
                                                }}
                                            />
                                        </Layer>
                                    );
                                })}
                            </Stage>
                        </div>
                    </div>
                    <div className="stage__sub-menu">
                        <div className="stage__price-block price-block">
                            <div className="price-block__manuf-cost">
                                Manufacturing Cost {template?.manufacturing_cost}$
                            </div>
                            <div className="price-block__name">
                                Set name Of product
                                <TextField
                                    required
                                    type="text"
                                    label="Name"
                                    variant="outlined"
                                    name={"name"}
                                    value={name}
                                    onChange={handleChangeInput}
                                    error={errors?.name}
                                    helperText={errors?.name && "Field is required"}
                                />
                            </div>
                            <div className="price-block__price">
                                Set Price Of product
                                <TextField
                                    required
                                    type="number"
                                    id="outlined-basic"
                                    label="Price"
                                    variant="outlined"
                                    name={"price"}
                                    value={price}
                                    onChange={handleChangeInput}
                                    error={errors?.price}
                                    helperText={errors?.price && "Field is required"}
                                />
                            </div>
                        </div>
                    </div>
                    {lowPriceCheck && (
                        <Alert severity="error">
                            <AlertTitle>
                                You cannot set price that is lover than manufacturing price.
                            </AlertTitle>
                            Price depends on the chosen quantity of sides for printing and can
                            be changed due customizing.
                        </Alert>
                    )}
                    <div className="price-block__desc">
                        <p>Add description here:</p>
                        <TextField
                            fullWidth={true}
                            required={true}
                            id="outlined-basic"
                            label="Product Description"
                            variant="outlined"
                            name={"description"}
                            value={description}
                            onChange={handleChangeInput}
                            error={errors?.description}
                            helperText={errors?.description && "Field is required"}
                        />
                    </div>
                    <div className="price-block__buttons">
                        <ButtonCreate
                            className="with-margin"
                            text={"reset"}
                            handleClick={handleFormReset}
                        />
                        <ButtonCreate
                            isDisabled={!isDisabled}
                            text={"send to moderation"}
                            handleClick={openModal}
                        />
                    </div>
                </div>
            </div>
        </div>
    ) : (
        <Preloader />
    );
};
