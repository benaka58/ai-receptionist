'use strict';

document.addEventListener(
    'DOMContentLoaded',
    () => {

        const form =
            document.getElementById(
                'loginForm'
            );

        const message =
            document.getElementById(
                'message'
            );


        if (!form) {
            return;
        }


        form.addEventListener(
            'submit',
            async (event) => {

                event.preventDefault();


                const username =
                    document
                        .getElementById(
                            'username'
                        )
                        .value
                        .trim();


                const password =
                    document
                        .getElementById(
                            'password'
                        )
                        .value;


                message.textContent =
                    'Signing in...';


                try {

                    const response =
                        await fetch(
                            '/api/login',
                            {
                                method: 'POST',

                                headers: {
                                    'Content-Type':
                                        'application/json'
                                },

                                credentials:
                                    'same-origin',

                                body:
                                    JSON.stringify({
                                        username:
                                            username,
                                        password:
                                            password
                                    })
                            }
                        );


                    const data =
                        await response.json();


                    if (
                        !response.ok ||
                        !data.success
                    ) {

                        throw new Error(
                            data.error ||
                            'Login failed.'
                        );
                    }


                    window.location.href =
                        '/admin';

                } catch (error) {

                    message.textContent =
                        error.message;
                }
            }
        );
    }
);