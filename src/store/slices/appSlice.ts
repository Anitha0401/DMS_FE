import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
    loading: boolean;
    error: string | null;
    manualTreeData: any;
    manualID: number;
    treeData: any;
    prevSectionVesrionId: number;
    secVerId_FL: string | null;
    parentId_FL: string | null;
    formatedDataURS: any;
    unReadSectionList: any;
    enableTreeCM: boolean;
    enableSectionCM: boolean;
    triggerID_CM: string | null;
    parentIdList: any[];
    istoExpandTree: boolean;
    userInfo: any;
    isUserReqdToReadManuals: boolean;

    selectedManualNodeObj: any | null; // New state to hold the selected manual node object
}

const initialState: AppState = {
    loading: false,
    error: null,
    manualTreeData: [],
    manualID: -1,
    treeData: [],
    prevSectionVesrionId: 1,
    secVerId_FL: null,
    parentId_FL: null,
    formatedDataURS: null,
    unReadSectionList: null,
    enableTreeCM: false,
    enableSectionCM: false,
    triggerID_CM: null,
    parentIdList: [],
    istoExpandTree: false,
    userInfo: null,
    isUserReqdToReadManuals: false,

    selectedManualNodeObj: null,
};

const appSlice = createSlice({
    name: 'appInfo',
    initialState,
    reducers: {
        setSelectedManualNodeObj(state, action: PayloadAction<any | null>) {
            state.selectedManualNodeObj = action.payload;
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
        setError(state, action: PayloadAction<string | null>) {
            state.error = action.payload;
        },
        clearError(state) {
            state.error = null;
        },
    },
});

export const { setLoading, setError, clearError, setSelectedManualNodeObj } = appSlice.actions;
export default appSlice.reducer;