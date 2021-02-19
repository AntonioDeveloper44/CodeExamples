import React, { useCallback, useEffect, useState } from "react";
import { useHistory, useLocation, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { ContentContainer } from "../../components/ContentContainer";
import { getAllInsights } from "../../redux/insights/insightsActions";
import { getAllProducts } from "../../redux/products/productsActions";
import { SectionTitle } from "../../components/SectionTitle";
import { scrollToTop } from "../../helpers";
import { BreadCrumbs } from "../../components/BreadCrumbs";
import { CustomTabs } from "../../components/CustomTabs";
import { getAllNews } from "../../redux/news/newsActions";
import { Search } from "../../components/Search";
import { Banner } from "../../components/Banner";
import bannerInsightsImg from "../../assets/images/bannerInsights.png";
import bannerImg from "../../assets/images/cashMachine.jpeg";
import "./styles.scss";

const useQuerySearchParams = (search) => new URLSearchParams(search);

export const TABS = {
    products: 0,
    insights: 1,
    news: 2,
};

export const Products = () => {
    const history = useHistory();
    const params = useParams();
    const dispatch = useDispatch();
    const location = useLocation();
    const search = location.search;
    const querySearchParams = useQuerySearchParams(search);
    const searchString = querySearchParams.get("search");
    const searchCategory = querySearchParams.get("category");

    const [activeTab, setActiveTab] = useState(TABS.products);
    const [searchValue, setSearch] = useState(searchString || "");
    const [page, setPage] = useState(1);
    const [currentOrdering, setCurrentOrdering] = useState({
        column: "name",
        order: "asc",
    });

    const insights = useSelector((state) => state.insightsReducer.insights);
    const products = useSelector((state) => state.productsReducer.products);
    const news = useSelector((state) => state.newsReducer.news);

    useEffect(() => {
        switch (activeTab) {
            case TABS.insights:
                dispatch(getAllInsights({ search_text: searchValue }));
                break;
            case TABS.news:
                dispatch(getAllNews({ search_text: searchValue }));
                break;
            default:
                dispatch(
                    getAllProducts({
                        search_text: searchValue,
                        category: searchCategory,
                    })
                );

                break;
        }
        //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const handleSearch = useCallback((searchValue) => {
        setPage(1);
        if (searchValue) {
            switch (activeTab) {
                case TABS.insights:
                    dispatch(getAllInsights({ search_text: searchValue }));
                    break;
                case TABS.news:
                    dispatch(getAllNews({ search_text: searchValue }));
                    break;
                default:
                    dispatch(
                        getAllProducts({
                            search_text: searchValue,
                        })
                    );
                    break;
            }
        } else {
            switch (activeTab) {
                case TABS.insights:
                    dispatch(getAllInsights({ search_text: "" }));
                    break;
                case TABS.news:
                    dispatch(getAllNews({ search_text: "" }));
                    break;
                default:
                    dispatch(
                        getAllProducts({
                            search_text: searchValue,
                            category: searchCategory,
                        })
                    );
                    break;
            }
        }
    });

    useEffect(() => {
        const { tab = "products" } = params;
        setActiveTab(TABS[tab]);
        setPage(1);
        handleSearch(searchValue);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [params]);

    useEffect(() => {
        let { order, column } = currentOrdering;
        switch (activeTab) {
            case TABS.insights:
                dispatch(
                    getAllInsights({
                        ordering: `${order === "asc" ? "" : "-"}${column}`,
                        search_text: searchValue,
                        page,
                    })
                );
                break;
            case TABS.news:
                dispatch(
                    getAllNews({
                        ordering: `${order === "asc" ? "" : "-"}${column}`,
                        search_text: searchValue,
                        page,
                    })
                );
                break;
            default:
                dispatch(
                    getAllProducts({
                        page,
                        ordering: `${order === "asc" ? "" : "-"}${column}`,
                        search_text: searchValue,
                        category: searchCategory,
                    })
                );
                break;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page]);

    // for cleaning field rerender
    useEffect(() => {
        if (searchString && searchValue !== searchString) {
            scrollToTop();
            setSearch(searchString);
            handleSearch(searchString);
        }
        if (searchCategory && searchValue !== searchString) {
            scrollToTop();
            setSearch(searchCategory);
            handleSearch(searchCategory);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onTabChange = (event, newValue) => {
        setActiveTab(newValue);
        switch (newValue) {
            case TABS.insights:
                setCurrentOrdering({ column: "name", order: "asc" });
                history.push("/radar/insights" + search);
                break;
            case TABS.news:
                history.push("/radar/news" + search);
                break;
            default:
                setCurrentOrdering({ column: "name", order: "asc" });
                history.push("/radar/products" + search);
        }
    };


    //pagination
    const pageSize = 10;

    let totalPages;

    if (activeTab === TABS.products) {
        totalPages = Math.ceil(products.num_of_obj / pageSize);
    }
    if (activeTab === TABS.insights) {
        totalPages = Math.ceil(insights.num_of_obj / pageSize);
    }
    if (activeTab === TABS.news) {
        totalPages = Math.ceil(news.numOfProducts / pageSize);
    }

    //sort
    const requestProductsSort = (column, order) => {
        setCurrentOrdering({ column, order });
        dispatch(
            getAllProducts({
                ordering: `${order === "asc" ? "" : "-"}${column}`,
                page: page,
                search_text: searchValue,
            })
        );
    };

    const requestInsightsSort = (column, order) => {
        setCurrentOrdering({ column, order });
        dispatch(
            getAllInsights({
                ordering: `${order === "asc" ? "" : "-"}${column}`,
                page: page,
                search_text: searchValue,
            })
        );
    };

    const requestNewsSort = (column, order) => {
        setCurrentOrdering({ column, order });
        dispatch(
            getAllNews({
                ordering: `${order === "asc" ? "" : "-"}${column}`,
                page: page,
                search_text: searchValue,
            })
        );
    };

    const handleChangePagination = (event, value) => {
        scrollToTop();
        setPage(value);
    };

    const renderBreadCrumbComponent = {
        [TABS.insights]: <BreadCrumbs insights />,
        [TABS.products]: <BreadCrumbs products />,
        [TABS.news]: <BreadCrumbs news />,
    };

    const renderSectionTitleComponents = {
        [TABS.insights]: (
            <SectionTitle
                title="Insights"
                subTitle={`You've viewed ${insights && insights.data?.length} of ${
                    insights.num_of_obj
                } insights`}
                bannerImg={bannerInsightsImg}
            />
        ),
        [TABS.news]: (
            <SectionTitle
                title="News"
                subTitle={`You've viewed ${news && news.data?.length} of ${
                    news.numOfProducts
                } news items`}
                bannerImg="https://www.knjizare-vulkan.rs/files/watermark/files/thumbs/files/images/slike_proizvoda/thumbs_1200/thumbs_w/320505_1200_1200px_w.jpg"
            />
        ),
        [TABS.products]: (
            <SectionTitle
                title="Products"
                subTitle={`You've viewed ${products && products.data?.length} of ${
                    products.num_of_obj
                } products`}
                bannerImg={bannerImg}
            />
        ),
    };

    return (
        <>
            <ContentContainer>
                <div className="products-page">
                    <Search
                        inputValue={searchValue}
                        handleSearchInputChange={(e) => {
                            const { value } = e.target;
                            setSearch(value);
                            if (value === "") {
                                handleSearch(value);
                            }
                        }}
                        onSearch={() => handleSearch(searchValue)}
                    />
                    {renderBreadCrumbComponent[activeTab]}
                    {renderSectionTitleComponents[activeTab]}
                    <CustomTabs
                        requestInsightsSort={requestInsightsSort}
                        requestNewsSort={requestNewsSort}
                        requestProductsSort={requestProductsSort}
                        page={page}
                        totalPages={totalPages}
                        handleChangePagination={handleChangePagination}
                        products={products.data}
                        insights={insights.data}
                        news={news.data}
                        setSearchValue={setSearch}
                        setSearch={handleSearch}
                        handleChange={onTabChange}
                        activeTab={activeTab}
                        currentOrdering={currentOrdering}
                    />
                </div>
            </ContentContainer>
            <Banner />
        </>
    );
};
