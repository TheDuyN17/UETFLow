// Re-export từ api.js để không break các import cũ
export { eAccount as default } from "./api";
export { eForm, eAccount, ApiError } from "./api";

import { eAccount, eForm } from "./api";

export const getAccount = () => eAccount.getProfile();
export const getMenuViews = () => fetch("/api/owner/menu-views").then(r => r.json());
export const getMenuSwaps = () => fetch("/api/menu-swaps").then(r => r.json());
export const findForms = (body, page, size) => eForm.findForms(body, page, size);
export const getForm = (formId) => eForm.getForm(formId);
export const createForm = (body) => eForm.createForm(body);
export const updateForm = (body) => eForm.updateForm(body);
export const duplicateForm = (formId) => eForm.duplicateForm(formId);
export const checkEdit = (formId) => eForm.checkEdit(formId);
export const publishForm = (formId) => eForm.publishForm(formId);
export const unpublishForm = (formId) => eForm.unpublishForm(formId);
export const deleteForm = (formId) => eForm.deleteForm(formId);
