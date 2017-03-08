
import * as rev from 'rev-models';
import * as api from '../index';

// EXAMPLE:
// import * as rev from 'rev-models'

export class Person {

    @rev.TextField({label: 'First Name'})
        first_name: string;
    @rev.TextField({label: 'Last Name'})
        last_name: string;
    @rev.IntegerField({label: 'Age', required: false })
        age: number;
    @rev.EmailField({label: 'Email'})
        email: string;
    @rev.BooleanField({label: 'Registered for Newsletter?'})
        newsletter: boolean;
    @rev.BooleanField({label: 'Date Registered'})
        date_registered: Date;
}

rev.register(Person);

api.register(Person, {
    operations: ['read'],
    methods: [
        {
           name: 'unsubscribe',
           args: ['email'],
           handler: async (context, email) => {
               console.log('Unsubscribe requested for', email);
               return 'Unsubscribed';
           }
        }
    ]
});
