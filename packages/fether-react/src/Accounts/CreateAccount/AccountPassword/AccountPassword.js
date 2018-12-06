// Copyright 2015-2018 Parity Technologies (UK) Ltd.
// This file is part of Parity.
//
// SPDX-License-Identifier: BSD-3-Clause

import React, { Component } from 'react';
import { AccountCard, Form as FetherForm } from 'fether-ui';
import { inject, observer } from 'mobx-react';

@inject('createAccountStore')
@observer
class AccountPassword extends Component {
  state = {
    confirm: '',
    isLoading: false,
    password: '',
    error: ''
  };

  handleConfirmChange = ({ target: { value } }) => {
    this.setState({ confirm: value });
  };

  handleNextStep = e => {
    const { history } = this.props;
    const { confirm, password } = this.state;

    e.preventDefault();

    if (e.target.type === 'click') {
      history.goBack();
    }

    if (
      e.target.type === 'submit' &&
      confirm &&
      password &&
      confirm === password
    ) {
      this.handleSubmit();
    }

    if (!password || !confirm) {
      this.setState({
        error: 'Cannot have empty form fields.'
      });
    }

    if (password && confirm && password !== confirm) {
      this.setState({
        error: 'Passwords do not match.'
      });
    }
  };

  handlePasswordChange = ({ target: { value } }) => {
    this.setState({ password: value });
  };

  handleSubmit = () => {
    const { createAccountStore, history } = this.props;
    const { password } = this.state;

    this.setState({ isLoading: true });

    // Save to parity
    createAccountStore
      .saveAccountToParity(password)
      .then(res => {
        createAccountStore.clear();
        history.push('/accounts');
      })
      .catch(err => {
        console.error(err);

        this.setState({
          isLoading: false,
          error: err.text
        });
      });
  };

  render () {
    const {
      createAccountStore: { address, name, isJSON, isImport },
      location: { pathname }
    } = this.props;
    const { confirm, error, isLoading, password } = this.state;
    const currentStep = pathname.slice(-1);

    return (
      <AccountCard
        address={address}
        name={name}
        drawers={[
          <form key='createAccount' onSubmit={this.handleNextStep}>
            <div className='text'>
              <p>
                {' '}
                {isJSON
                  ? 'Unlock your account to decrypt your JSON keystore file: '
                  : 'Secure your account with a password:'}
              </p>
            </div>

            <FetherForm.Field
              label='Password'
              onChange={this.handlePasswordChange}
              required
              type='password'
              value={password}
            />

            {!isJSON && (
              <FetherForm.Field
                label='Confirm'
                onChange={this.handleConfirmChange}
                required
                type='password'
                value={confirm}
              />
            )}

            <p>
              {error && error + ' Please check your password and try again.'}
            </p>

            <nav className='form-nav -space-around'>
              {currentStep > 1 && (
                <button
                  className='button -cancel'
                  onClick={this.handleNextStep}
                >
                  Back
                </button>
              )}
              <button
                className='button'
                disabled={
                  !password || (!isJSON && confirm !== password) || isLoading
                }
              >
                Confirm account {isImport ? `${'import'}` : `${'creation'}`}
              </button>
            </nav>
          </form>
        ]}
      />
    );
  }
}

export default AccountPassword;
