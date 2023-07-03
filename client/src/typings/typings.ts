export interface ICourse {
    name: string;
    releaseDetails: ICourseReleaseDetails;
    sections: ICourseSection[];
}

export interface ICourseSection {
    name: string;
    assets: ICourseAsset[];
}

export interface IAssetData {
    url: string;
    id: number;
    node_id: string;
    name: string;
    label: string;
    uploader: {
        login: string;
        id: number;
        node_id: string;
        avatar_url: string;
        gravatar_id: string;
        url: string;
        html_url: string;
        followers_url: string;
        following_url: string;
        gists_url: string;
        starred_url: string;
        subscriptions_url: string;
        organizations_url: string;
        repos_url: string;
        events_url: string;
        received_events_url: string;
        type: string;
        site_admin: false;
    };
    content_type: string;
    state: string;
    size: number;
    download_count: number;
    created_at: string;
    updated_at: string;
    browser_download_url: string;
}

export interface ICourseAsset {
    name: string;
    originUrl: string;
    assetData: IAssetData;
    compressedAssetData: IAssetData;
}

export interface ICourseReleaseDetails {
    url: string;
    assets_url: string;
    upload_url: string;
    html_url: string;
    id: number;
    author: {
        login: string;
        id: number;
        node_id: string;
        avatar_url: string;
        gravatar_id: string;
        url: string;
        html_url: string;
        followers_url: string;
        following_url: string;
        gists_url: string;
        starred_url: string;
        subscriptions_url: string;
        organizations_url: string;
        repos_url: string;
        events_url: string;
        received_events_url: string;
        type: string;
        site_admin: false;
    };
    node_id: string;
    tag_name: string;
    target_commitish: string;
    name: string;
    draft: false;
    prerelease: false;
    created_at: string;
    published_at: string;
    assets: ICourseAsset["assetData"][];
    tarball_url: string;
    zipball_url: string;
    body: string;
}
