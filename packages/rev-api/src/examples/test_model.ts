
import * as rev from 'rev-models';

export class Person extends rev.Model {

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

export const models: rev.ModelRegistry = new rev.ModelRegistry();
models.registerBackend('default', new rev.InMemoryBackend());
models.register(Person);
