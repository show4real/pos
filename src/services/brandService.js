import settings from './settings';
import { authHeader } from './authHeader';
import { authService } from './authService';


export function getbrands(data) {
    const requestOptions = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(data)
    };
    return fetch(`${settings.API_URL}brands`, requestOptions).then(authService.handleResponse);
}

export function getbarcodes(data) {
    const requestOptions = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(data)
    };
    return fetch(`${settings.API_URL}barcodes/xxx`, requestOptions).then(authService.handleResponse);
}

export function addBarcodes(data) {
    const requestOptions = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(data)
    };
    return fetch(`${settings.API_URL}barcodes/generate`, requestOptions).then(authService.handleResponse);
}

export function updateBarcode(data) {
    const requestOptions = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(data)
    };
    return fetch(`${settings.API_URL}barcodes/update`, requestOptions).then(authService.handleResponse);
}

export function addBrands(data) {
    const requestOptions = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(data)
    };
    return fetch(`${settings.API_URL}addbrands`, requestOptions).then(authService.handleResponse);
}

export function editBrand(data) {
    const requestOptions = {
        method: 'POST',
        headers: authHeader(),
        body: JSON.stringify(data)
    };
    return fetch(`${settings.API_URL}updatebrand/${data.id}`, requestOptions).then(authService.handleResponse);
}


