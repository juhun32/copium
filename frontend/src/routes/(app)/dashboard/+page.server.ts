import type { PageServerLoad } from './$types';
import { BACKEND_URL } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

// load function 
export const load: PageServerLoad = async ({ fetch, url }) => {
    const page = url.searchParams.get('page');
    const query = url.searchParams.get('q');
    const company = url.searchParams.get('company');
    const status = url.searchParams.get('status');
    const role = url.searchParams.get('role');
    const location = url.searchParams.get('location');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    const params = new URLSearchParams();
    if (page) params.set('page', page);
    if (query) params.set('q', query);
    if (company) params.set('company', company);
    if (status) params.set('status', status);
    if (role) params.set('role', role);
    if (location) params.set('location', location);
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    console.log(params.toString());

    const dashboardURL = `${BACKEND_URL}/user/dashboard?${params.toString()}`;

    const response = await fetch(dashboardURL, {
        credentials: 'include'  // every protected route needs to include credentials
    });
    
    if (!response.ok) {
        throw redirect(303, `${BACKEND_URL}/auth/google`);
    }

    const data = await response.json();

    const applications = data.applications || [];
    // algolia is 0-indexed and backend always sends 0-indexed page
    // so, if !currentPage or !totalPages (aka 0), then set to 1
    const currentPage = parseInt(data.currentPage) || 1;
    const totalPages = parseInt(data.totalPages) || 1;
    const clientParams = params.toString();

    console.log("applications extracted")
    console.log("currentPage:" + currentPage)
    console.log("totalPages:" + totalPages)
    console.log("clientParams:" + clientParams)
    
    return {
        applications,
        currentPage,
        totalPages,
        clientParams,
    };
};

export const actions = {
    add: async ({ request, fetch }) => {
        const formData = await request.formData();
        const data = {
            role: formData.get('role'),
            company: formData.get('company'),
            location: formData.get('location'),
            appliedDate: Date.parse(formData.get('appliedDate') as string),
            link: formData.get('link'),
            status: 'Applied'
        }

        const response = await fetch(`${BACKEND_URL}/user/addApplication`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            return {
                type: 'error',
                message: 'Failed to add application'
            };
        }

        return {
            type: 'success',
            message: 'Application added successfully'
        };
    },
    delete: async ({ request, fetch }) => {
        const formData = await request.formData();
        const body = {
            id: formData.get('id'),
            company: formData.get('company'),
            role: formData.get('role'),
            location: formData.get('location'),
            status: formData.get('status'),
            // unlike addApplication, this is already sent as unix timestamp
            appliedDate: Number(formData.get('appliedDate')),
            link: formData.get('link')
        }

        const response = await fetch(`${BACKEND_URL}/user/deleteApplication`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            return {
                type: 'error',
                message: 'Failed to delete application'
            };
        }
        
        return {
            type: 'success',
            message: 'Application deleted successfully'
        };
    },
    editstatus: async ({ request, fetch }) => {
        const formData = await request.formData();
        const body = {
            id: formData.get('id'),
            status: formData.get('status'),
            oldStatus: formData.get('oldStatus'),
        }

        const response = await fetch(`${BACKEND_URL}/user/editStatus`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            return {
                type: 'error',
                message: 'Failed to update application status'
            };
        }
        
        return {
            type: 'success',
            message: 'Application status updated successfully'
        };
    },
    editapplication: async({ request, fetch }) => {
        const formData = await request.formData();
        const body = {
            id: formData.get('id'),
            role: formData.get('role'),
            company: formData.get('company'),
            location: formData.get('location'),
            // this is sent as mm-dd-yyyy so parse into unix timestamp
            appliedDate: Date.parse(formData.get('appliedDate') as string),
            link: formData.get('link'),
            oldRole: formData.get('oldRole'),
            oldCompany: formData.get('oldCompany'),
            oldLocation: formData.get('oldLocation'),
            // this is already unix timestamp
            oldAppliedDate: Number(formData.get('oldAppliedDate')),
            oldLink: formData.get('oldLink'),
        }

        const response = await fetch(`${BACKEND_URL}/user/editApplication`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            return {
                type: 'error',
                message: 'Failed to update application'
            };
        }

        throw redirect(303, '/dashboard');
    }
} satisfies Actions;