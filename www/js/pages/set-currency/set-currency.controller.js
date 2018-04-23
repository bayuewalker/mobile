/**
 * @name set-currency controller
 * @author Nazanin Reihani haghighi
 * @contributors []
 * @since 10/18/2017
 * @copyright Binary Ltd
 */

(function() {
    angular.module("binary.pages.set-currency.controllers").controller("SetCurrencyController", SetCurrency);

    SetCurrency.$inject = ['$scope',
        '$rootScope',
        '$state',
        'config',
        'appStateService',
        'websocketService',
        'accountService',
        'clientService'];

    function SetCurrency($scope,
        $rootScope,
        $state,
        config,
        appStateService,
        websocketService,
        accountService,
        clientService) {
        const vm = this;
        const cryptoConfig = config.cryptoConfig;
        const currencyConfig = appStateService.currenciesConfig;
        const accounts = accountService.getAll();
        const currentAccount = accountService.getDefault();
        const landingCompany = currentAccount.landing_company_name || localStorage.getItem('landingCompany');
        vm.isCRAccount = landingCompany ? landingCompany === 'costarica' : /CR/i.test(currentAccount.id);
        vm.currenciesOptions = [];

        vm.getCurrenciesOptions = () => {
            const legalAllowedCurrencies = clientService.landingCompanyValue(currentAccount.id, 'legal_allowed_currencies');
            if (vm.isCRAccount) {
                const existingCurrencies = clientService.getExistingCurrencies(accounts);
                if (existingCurrencies.length) {
                    const dividedExistingCurrencies = clientService.dividedCurrencies(existingCurrencies);
                    const hasFiat = dividedExistingCurrencies.fiatCurrencies.length > 0;
                    if (hasFiat) {
                        const legalAllowedCryptoCurrencies =
                            clientService.dividedCurrencies(legalAllowedCurrencies).cryptoCurrencies;
                        const existingCryptoCurrencies = dividedExistingCurrencies.cryptoCurrencies;
                        return _.difference(legalAllowedCryptoCurrencies, existingCryptoCurrencies);
                    }
                    return _.difference(legalAllowedCurrencies, existingCurrencies);
                }
                return legalAllowedCurrencies;
            }
            // for all accounts except CR accounts
            return legalAllowedCurrencies;
        };

        const populateOptions = (options) => {
            options.forEach(curr => {
                const currency = currencyConfig[curr];
                const isCryptoCurrency = /crypto/i.test(currencyConfig[curr].type);
                currency.symb = curr;
                currency.isCryptoCurrency = isCryptoCurrency;
                currency.img = `img/currency/${curr.toLowerCase()}.svg`;
                if (isCryptoCurrency) {
                    currency.name = cryptoConfig[curr].name;
                }
                vm.currenciesOptions.push(currencyConfig[curr]);
            });
        };

        const hasCurrency = () => {
            $scope.$applyAsync(() => {
                vm.hasCryptoOption = _.findIndex(vm.currenciesOptions, 'isCryptoCurrency') > -1;
                vm.hasFiatOption = _.findIndex(vm.currenciesOptions, ['isCryptoCurrency', false]) > -1;
            });
        };

        vm.setCurrencyOfAccount = (selectedCurrency) => {
            websocketService.sendRequestFor.setAccountCurrency(selectedCurrency);
        }

        $scope.$on('set_account_currency:success', (e, currency) => {
            const accounts = JSON.parse(localStorage.accounts);
            for (let i = 0; i < accounts.length; i++) {
                if (accounts[i].is_default === true){
                    accounts[i].currency = currency;
                    break;
                }
            }
            localStorage.setItem("accounts", JSON.stringify(accounts));
            appStateService.accountCurrencyChanged = true;
            $rootScope.$broadcast("currency:changed", currency);
            // if user is redirected here from accounts-management page redirect him/her to account-management page
            if (vm.from === 'accounts-management') {
                $state.go("accounts-management");
            } else {
                $state.go("trade");
            }
        });

        $scope.$on('$stateChangeSuccess', (ev, to, toParams, from, fromParams) => {
            vm.from = from.name;
        });

        const init = () => {
            const options = vm.getCurrenciesOptions();
            populateOptions(options);
            hasCurrency();
        };

        init();
    }
})();
