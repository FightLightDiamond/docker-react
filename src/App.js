import logo from './logo.svg';
import './App.css';
import GooglePayButton from "@google-pay/button-react";


function App() {
    function processPayment(paymentData) {
        return new Promise(function (resolve, reject) {
            setTimeout(function () {
                // show returned data in developer console for debugging
                console.log(paymentData);
                // @todo pass payment token to your gateway to process payment
                const paymentToken = paymentData.paymentMethodData.tokenizationData.token;

                resolve({});
            }, 3000);
        });
    }

    function onPaymentAuthorized(paymentData) {
        console.log(paymentData)
        return new Promise(function (resolve, reject) {
            // handle the response
            processPayment(paymentData)
                .then(function () {
                    resolve({transactionState: 'SUCCESS'});
                })
                .catch(function () {
                    resolve({
                        transactionState: 'ERROR',
                        error: {
                            intent: 'PAYMENT_AUTHORIZATION',
                            message: 'Insufficient funds, try again. Next attempt should work.',
                            reason: 'PAYMENT_DATA_INVALID'
                        }
                    });
                });
        });
    }

    function onPaymentDataChanged(intermediatePaymentData) {
        return new Promise(function (resolve, reject) {

            let shippingAddress = intermediatePaymentData.shippingAddress;
            let shippingOptionData = intermediatePaymentData.shippingOptionData;
            let paymentDataRequestUpdate = {};

            if (intermediatePaymentData.callbackTrigger == "INITIALIZE" || intermediatePaymentData.callbackTrigger == "SHIPPING_ADDRESS") {
                if (shippingAddress.administrativeArea == "NJ") {
                    paymentDataRequestUpdate.error = getGoogleUnserviceableAddressError();
                } else {
                    paymentDataRequestUpdate.newShippingOptionParameters = getGoogleDefaultShippingOptions();
                    let selectedShippingOptionId = paymentDataRequestUpdate.newShippingOptionParameters.defaultSelectedOptionId;
                    paymentDataRequestUpdate.newTransactionInfo = calculateNewTransactionInfo(selectedShippingOptionId);
                }
            } else if (intermediatePaymentData.callbackTrigger == "SHIPPING_OPTION") {
                paymentDataRequestUpdate.newTransactionInfo = calculateNewTransactionInfo(shippingOptionData.id);
            }

            resolve(paymentDataRequestUpdate);
        });
    }

    function getGoogleTransactionInfo() {
        return {
            displayItems: [
                {
                    label: "Subtotal",
                    type: "SUBTOTAL",
                    price: "11.00",
                },
                {
                    label: "Tax",
                    type: "TAX",
                    price: "1.00",
                }
            ],
            countryCode: 'US',
            currencyCode: "USD",
            totalPriceStatus: "FINAL",
            totalPrice: "12.00",
            totalPriceLabel: "Total"
        };
    }

    function getShippingCosts() {
        return {
            "shipping-001": "0.00",
            "shipping-002": "1.99",
            "shipping-003": "10.00"
        }
    }

    function calculateNewTransactionInfo(shippingOptionId) {
        let newTransactionInfo = getGoogleTransactionInfo();

        let shippingCost = getShippingCosts()[shippingOptionId];
        newTransactionInfo.displayItems.push({
            type: "LINE_ITEM",
            label: "Shipping cost",
            price: shippingCost,
            status: "FINAL"
        });

        let totalPrice = 0.00;
        newTransactionInfo.displayItems.forEach(displayItem => totalPrice += parseFloat(displayItem.price));
        newTransactionInfo.totalPrice = totalPrice.toString();

        return newTransactionInfo;
    }

    function getGoogleDefaultShippingOptions() {
        return {
            defaultSelectedOptionId: "shipping-001",
            shippingOptions: [
                {
                    "id": "shipping-001",
                    "label": "Free: Standard shipping",
                    "description": "Free Shipping delivered in 5 business days."
                },
                {
                    "id": "shipping-002",
                    "label": "$1.99: Standard shipping",
                    "description": "Standard shipping delivered in 3 business days."
                },
                {
                    "id": "shipping-003",
                    "label": "$10: Express shipping",
                    "description": "Express shipping delivered in 1 business day."
                },
            ]
        };
    }

    function getGoogleUnserviceableAddressError() {
        return {
            reason: "SHIPPING_ADDRESS_UNSERVICEABLE",
            message: "Cannot ship to the selected address",
            intent: "SHIPPING_ADDRESS"
        };
    }

    return (
        <div className="App">
            <header className="App-header">
                <img src={logo} className="App-logo" alt="logo"/>
                <p>
                    Edit <code>src/App.js</code> and save to reload. ff
                </p>
                <a
                    className="App-link"
                    href="https://reactjs.org"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Learn React
                </a>
            </header>

            <GooglePayButton
                environment="TEST"
                paymentRequest={{
                    apiVersion: 2,
                    apiVersionMinor: 0,
                    allowedPaymentMethods: [
                        {
                            type: 'CARD',
                            parameters: {
                                allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
                                allowedCardNetworks: ['MASTERCARD', 'VISA'],
                            },
                            tokenizationSpecification: {
                                type: 'PAYMENT_GATEWAY',
                                parameters: {
                                    gateway: 'example',
                                    gatewayMerchantId: 'exampleGatewayMerchantId',
                                },
                            },
                        },
                    ],
                    merchantInfo: {
                        merchantId: '12345678901234567890',
                        merchantName: 'Demo Merchant',
                    },
                    transactionInfo: {
                        totalPriceStatus: 'FINAL',
                        totalPriceLabel: 'Total',
                        totalPrice: '100.00',
                        currencyCode: 'USD',
                        countryCode: 'US',
                    },
                }}
                onLoadPaymentData={paymentRequest => {
                    console.log('load payment data', paymentRequest);
                }}

                onCancel={res => console.log('Cancel', res)}
                onError={res => console.log('onError', res)}
                onClick={res => console.log('onClick', res)}

                onPaymentAuthorized={(paymentData) => onPaymentAuthorized(paymentData)}
                onPaymentDataChanged={(intermediatePaymentData) => onPaymentDataChanged(intermediatePaymentData)}

                onReadyToPayChange={result => console.log('Result', result)}
            />
        </div>
    );
}

export default App;
