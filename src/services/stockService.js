import settings from "./settings";
import { authHeader } from "./authHeader";
import { authService } from "./authService";

export function getStock(data) {
  const requestOptions = {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(data),
  };
  return fetch(`${settings.API_URL}stocks`, requestOptions).then(
    authService.handleResponse
  );
}

export function getBranchStocks(data) {
  // get stocks based on branch of auth user
  // Admin get to see all branches stocks and can sell them
  const requestOptions = {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(data),
  };

  return fetch(`${settings.API_URL}branch_stocks`, requestOptions).then(
    authService.handleResponse
  );
}

export function getBranchStocks2(data) {
  const requestOptions = {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(data),
  };

  return fetch(`${settings.API_URL}stocks2`, requestOptions).then(
    authService.handleResponse
  );
}

export function getSingleStock(data) {
  const requestOptions = {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(data),
  };
  return fetch(`${settings.API_URL}stock/${data.id}`, requestOptions).then(
    authService.handleResponse
  );
}

export function editSerialNo(data) {
  const requestOptions = {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(data),
  };
  return fetch(`${settings.API_URL}editserial/${data.id}`, requestOptions).then(
    authService.handleResponse
  );
}

export function getSerialNos(data) {
  const requestOptions = {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(data),
  };
  return fetch(`${settings.API_URL}serials`, requestOptions).then(
    authService.handleResponse
  );
}

export function returnStock(data) {
  const requestOptions = {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(data),
  };
  return fetch(`${settings.API_URL}returnstock`, requestOptions).then(
    authService.handleResponse
  );
}

export function moveStock(data) {
  const requestOptions = {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(data),
  };
  return fetch(`${settings.API_URL}movestock`, requestOptions).then(
    authService.handleResponse
  );
}

export function createStock(data) {
  const requestOptions = {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(data),
  };
  return fetch(`${settings.API_URL}create/stocks`, requestOptions).then(
    authService.handleResponse
  );
}

export function editStock(data) {
  const requestOptions = {
    method: "POST",
    headers: authHeader(),
    body: JSON.stringify(data),
  };
  return fetch(`${settings.API_URL}edit/stock/${data.id}`, requestOptions).then(
    authService.handleResponse
  );
}

export function deleteStock(id) {
    const requestOptions = {
        method: 'POST',
        headers: authHeader()
    };
    return fetch(`${settings.API_URL}delete/stock/${id}`, requestOptions).then(authService.handleResponse);
}
