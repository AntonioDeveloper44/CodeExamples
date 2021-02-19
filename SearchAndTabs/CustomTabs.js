import React, { useEffect, useState } from "react";
import { CircularProgress } from "@material-ui/core";
import { ResultsLimiter } from "../ResultsLimiter";
import { useDispatch, useSelector } from "react-redux";
import {
    followProduct,
    unfollowProduct,
} from "../../redux/products/productsActions";
import { checkAuth, scrollToTop } from "../../helpers";
import { getAllFollowsProducts } from "../../redux/userSubscription/userSubscriptionActions";
import { ModalCreditCounter } from "../ModalCreditCounter";
import { PaginationAuthPro } from "../PaginationAuthPro";
import { ProductTab } from "../ProductTab";
import { useHistory } from "react-router-dom";
import { TabHeader } from "./components/TabHeader";
import { AuthModal } from "../AuthModal";
import { TABS } from "../../pages/Products";
import AppBar from "@material-ui/core/AppBar";
import Tabs from "@material-ui/core/Tabs";
import Tab from "@material-ui/core/Tab";
import Box from "@material-ui/core/Box";
import _ from "lodash";
import "./styles.scss";

function TabPanel(props) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box p={3}>
                    <div>{children}</div>
                </Box>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        "aria-controls": `simple-tabpanel-${index}`,
    };
}

const redirectURL = {
    insight: (id) => `/insight/${id}`,
    company: (id) => `/company/${id}`,
    product: (id) => `/product/${id}`,
};

export const CustomTabs = ({
                               setSearchValue,
                               handleChange,
                               activeTab,
                               setSearch,
                               products,
                               insights,
                               news,
                               page,
                               totalPages,
                               handleChangePagination,
                               requestProductsSort,
                               requestInsightsSort,
                               requestNewsSort,
                               currentOrdering,
                           }) => {
    const isFetching = useSelector((state) => state.commonReducer.isFetching);
    const currentCredits = useSelector(
        (state) => state.userSubscriptionReducer.subscription.credits
    );

    const dispatch = useDispatch();
    const history = useHistory();

    ////////////////////////////////////////////
    const renderTabHeaderComponent = {
        [TABS.insights]: (
            <TabHeader
                requestSort={requestInsightsSort}
                currentOrdering={currentOrdering}
                insightsType
            />
        ),
        [TABS.news]: (
            <TabHeader
                newsType
                currentOrdering={currentOrdering}
                requestSort={requestNewsSort}
            />
        ),
        [TABS.products]: (
            <TabHeader
                productsType
                currentOrdering={currentOrdering}
                requestSort={requestProductsSort}
            />
        ),
    };

    const followedProducts = useSelector(
        (state) => state.userSubscriptionReducer.followedProducts.data
    );

    useEffect(() => {
        if (checkAuth()) {
            dispatch(getAllFollowsProducts());
        }
    }, [dispatch]);

    const foundFollows = _.intersectionBy(products, followedProducts, "id");

    const toggleProductFollow = (id) => {
        if (!checkAuth()) {
            history.push("/login");
            return;
        }

        if (foundFollows?.find((f) => f.id === id)) {
            return dispatch(unfollowProduct(id));
        }
        return dispatch(followProduct(id));
    };

    const generateBtnText = (id) => {
        return _.map(foundFollows, "id").includes(id) ? "Unfollow" : "Follow";
    };
    //Modal
    const [authModal, setAuthModal] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [redirect, setRedirect] = useState(null);

    const onModalClose = () => {
        setIsModalOpen(false);
    };
    const closeAuthModal = () => {
        setAuthModal(false);
    };

    const openProduct = (type, id) => {
        if (!checkAuth()) {
            setAuthModal(true);
            return;
        }

        const redirectUrl = redirectURL[type](id);
        //gets type and id from args

        setRedirect(redirectUrl);

        if (!localStorage.getItem("modalHidden")) {
            setIsModalOpen(true);
            return;
        }

        redirectToNextPage(redirectUrl);
    };

    const onProceedClick = () => {
        setIsModalOpen(false);
        redirectToNextPage(redirect);
    };

    const redirectToNextPage = (url) => {
        scrollToTop();
        history.push({
            pathname: url,
        });
    };

    const generateAction = () => {
        switch (activeTab) {
            case 0:
                return "view product";
            case 1:
                return "view insight";
            default:
                return "this.";
        }
    };

    return (
        <div className="custom-tabs">
            <AppBar position="static">
                <Tabs
                    indicatorColor={"transparent"}
                    value={activeTab}
                    onChange={handleChange}
                    aria-label="simple tabs example"
                >
                    <Tab label="Products" {...a11yProps(TABS.products)} />
                    <Tab label="Insights" {...a11yProps(TABS.insights)} />
                    <Tab label="News" {...a11yProps(TABS.news)} />
                </Tabs>
            </AppBar>
            <div className="custom-tabs__tab-panels">
                {renderTabHeaderComponent[activeTab]}
                <TabPanel value={activeTab} index={TABS.products}>
                    {isFetching && <CircularProgress color="secondary" />}
                    {products ? (
                        products.map((product, index) => {
                            return (
                                <ProductTab
                                    setSearchValue={setSearchValue}
                                    columnDirection
                                    productId={product?.id}
                                    companyId={product?.company?.id}
                                    key={index + "product"}
                                    image={product?.company?.logo}
                                    companyName={product?.company?.name || "--"}
                                    productName={product.name}
                                    categoryName={product.category[0]?.name}
                                    description={product.description}
                                    tags={product.tags}
                                    rank={product.rank}
                                    setSearch={setSearch}
                                    toggleFollow={() => toggleProductFollow(product.id)}
                                    buttonText={generateBtnText(product.id)}
                                    onProductClick={() => {
                                        if (!product.is_visited) openProduct("product", product.id);
                                        else history.push(`/product/${product.id}`);
                                    }}
                                    onCompanyClick={() => {
                                        if (!product.company_visited)
                                            openProduct("company", product?.company?.id);
                                        else history.push(`/company/${product?.company?.id}`);
                                    }}
                                />
                            );
                        })
                    ) : (
                        <p>No results were found for your search </p>
                    )}
                    {checkAuth() && (
                        <PaginationAuthPro
                            page={page}
                            totalPages={totalPages}
                            handleChange={handleChangePagination}
                        />
                    )}
                    <ResultsLimiter />
                </TabPanel>
                <TabPanel value={activeTab} index={TABS.insights}>
                    {isFetching && <CircularProgress color="secondary" />}
                    {insights ? (
                        insights.map((insight, index) => {
                            return (
                                <ProductTab
                                    insight={insight}
                                    setSearchValue={setSearchValue}
                                    downloadBtn={insight.current_location_url}
                                    onInsightClick={() => {
                                        if (!insight.is_visited)
                                            openProduct(
                                                "insight",
                                                insight?.id,
                                                insight?.insight_type
                                            );
                                        else history.push(`/insight/${insight?.id}`);
                                    }}
                                    downloadLink={insight.current_location_url}
                                />
                            );
                        })
                    ) : (
                        <p>No results were found for your search </p>
                    )}
                    {checkAuth() && (
                        <PaginationAuthPro
                            page={page}
                            totalPages={totalPages}
                            handleChange={handleChangePagination}
                        />
                    )}
                    <ResultsLimiter />
                </TabPanel>
                <TabPanel value={activeTab} index={TABS.news}>
                    {isFetching && <CircularProgress color="secondary" />}
                    {news ? (
                        news.map((newsItem, index) => {
                            return (
                                <ProductTab
                                    setSearchValue={setSearchValue}
                                    key={index + "news"}
                                    image="https://region-news.kr.ua/wp-content/uploads/2020/07/23.jpg"
                                    docType={newsItem.publication}
                                    date={newsItem.pub_date}
                                    title={newsItem.title}
                                    description={newsItem.description}
                                    newsType
                                    newsLink={newsItem.link}
                                />
                            );
                        })
                    ) : (
                        <p>No results were found for your search </p>
                    )}
                    {checkAuth() && (
                        <PaginationAuthPro
                            page={page}
                            totalPages={totalPages}
                            handleChange={handleChangePagination}
                        />
                    )}
                </TabPanel>
            </div>
            <ModalCreditCounter
                open={isModalOpen}
                handleClose={onModalClose}
                buttonText="Confirm to proceed"
                currentCredits={currentCredits}
                onButtonClick={onProceedClick}
                priceForAction={1}
                action={generateAction()}
            />
            <AuthModal open={authModal} handleClose={closeAuthModal} />
        </div>
    );
};
