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
    password: ''
  };

  handleConfirmChange = ({ target: { value } }) => {
    this.setState({ confirm: value });
  };

  handlePasswordChange = ({ target: { value } }) => {
    this.setState({ password: value });
  };

  handleSubmit = event => {
    const { createAccountStore, history } = this.props;
    const { password } = this.state;

    event.preventDefault();
    this.setState({ isLoading: true });

    // Save to parity
    createAccountStore.saveAccountToParity(password).then(() => {
      createAccountStore.clear();
      history.push('/accounts');
    });
  };

  render () {
    const {
      createAccountStore: { address, name },
      history,
      location: { pathname }
    } = this.props;
    const { confirm, isLoading, password } = this.state;
    const currentStep = pathname.slice(-1);

    return (
      <AccountCard
        address={address}
        name={name}
        drawers={[
          <form key='createAccount' onSubmit={this.handleSubmit}>
            <div className='text'>
              <p>Secure your account with a password:</p>
            </div>

            <FetherForm.Field
              label='Password'
              onChange={this.handlePasswordChange}
              required
              type='password'
              value={password}
            />

            <FetherForm.Field
              label='Confirm'
              onChange={this.handleConfirmChange}
              required
              type='password'
              value={confirm}
            />

            <nav className='form-nav -space-around'>
              {currentStep > 1 && (
                <button className='button -cancel' onClick={history.goBack}>
                  Back
                </button>
              )}
              <button
                className='button'
                disabled={!password || confirm !== password || isLoading}
              >
                Confirm account creation
              </button>
            </nav>
          </form>
        ]}
      />
    );
  }
}

export default AccountPassword;
