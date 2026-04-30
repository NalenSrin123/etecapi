<script setup>
import { computed, reactive, ref } from 'vue';

const storageKey = 'teaching-api-dashboard';
const productionApiBaseUrl = 'http://etecapi.atwebpages.com/api';
const defaultApiBaseUrl = import.meta.env.DEV ? '/api' : productionApiBaseUrl;
const legacyApiBaseUrls = [
  'https://etecapi.byethost7.com/api',
  'http://etecapi.byethost7.com/api',
];

const savedState = loadSavedState();

const api = reactive({
  baseUrl: resolveInitialBaseUrl(savedState.baseUrl),
  apiKey: savedState.apiKey || '',
});

const classForm = reactive({
  class_name: '',
});

const ui = reactive({
  creatingClass: false,
});

const classSummary = ref(savedState.classSummary || null);
const notice = ref('');
const errorMessage = ref('');
const hasCreatedClass = computed(() => Boolean(classSummary.value?.api_key));

const apiDocs = computed(() => {
  const currentApiKey = classSummary.value?.api_key || api.apiKey || 'your-class-api-key';
  const docs = [
    {
      name: 'Create Class',
      method: 'POST',
      path: '/classes',
      auth: 'No',
      body: '{ "class_name": "Class A" }',
      notes: 'Creates a class and returns the generated API key.',
      locked: false,
    },
  ];

  if (!hasCreatedClass.value) {
    return docs;
  }

  return [
    ...docs,
    {
      name: 'Get Products',
      method: 'GET',
      path: '/products',
      auth: `Yes, x-api-key: ${currentApiKey}`,
      body: 'No request body',
      notes: 'Lists products for the class that owns the API key.',
      locked: false,
    },
    {
      name: 'Create Product',
      method: 'POST',
      path: '/products',
      auth: `Yes, x-api-key: ${currentApiKey}`,
      body: '{ "name": "Mouse", "description": "Wireless", "price": 19.99, "image_url": "https://..." }',
      notes: 'Creates a new product for the current class. Available only after class creation.',
      locked: false,
    },
    {
      name: 'Upload Product Image',
      method: 'POST',
      path: '/products/upload',
      auth: `Yes, x-api-key: ${currentApiKey}`,
      body: 'FormData: image=<file>',
      notes: 'Uploads an image and returns a public image URL.',
      locked: false,
    },
    {
      name: 'Update Product',
      method: 'POST + X-HTTP-Method-Override: PUT',
      path: '/products/{id}',
      auth: `Yes, x-api-key: ${currentApiKey}`,
      body: '{ "name": "Mouse", "description": "Wireless", "price": 25, "image_url": "https://...", "remove_image": false }',
      notes: 'Updates a product by id.',
      locked: false,
    },
    {
      name: 'Delete Product',
      method: 'DELETE',
      path: '/products/{id}',
      auth: `Yes, x-api-key: ${currentApiKey}`,
      body: 'No request body',
      notes: 'Deletes a product by id.',
      locked: false,
    },
  ];
});

function loadSavedState() {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch {
    return {};
  }
}

function persistState() {
  localStorage.setItem(
    storageKey,
    JSON.stringify({
      baseUrl: api.baseUrl.trim(),
      apiKey: api.apiKey.trim(),
      classSummary: classSummary.value,
    }),
  );
}

function resolveInitialBaseUrl(savedBaseUrl) {
  const normalizedSavedBaseUrl = normalizeBaseUrl(savedBaseUrl || '');

  if (!normalizedSavedBaseUrl) {
    return defaultApiBaseUrl;
  }

  if (legacyApiBaseUrls.includes(normalizedSavedBaseUrl)) {
    return defaultApiBaseUrl;
  }

  if (import.meta.env.DEV && normalizedSavedBaseUrl === productionApiBaseUrl) {
    return '/api';
  }

  return normalizedSavedBaseUrl;
}

function normalizeBaseUrl(url) {
  return url.trim().replace(/\/+$/, '');
}

function setNotice(message) {
  notice.value = message;
  errorMessage.value = '';
}

function setError(message) {
  errorMessage.value = message;
  notice.value = '';
}

function clearMessages() {
  notice.value = '';
  errorMessage.value = '';
}

async function request(path, options = {}) {
  const baseUrl = normalizeBaseUrl(api.baseUrl);

  if (!baseUrl) {
    throw new Error('API base URL is required.');
  }

  const headers = new Headers(options.headers || {});

  if (options.useApiKey !== false && api.apiKey.trim()) {
    headers.set('x-api-key', api.apiKey.trim());
  }

  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  let data = null;
  let rawText = '';

  if (contentType.includes('application/json')) {
    data = await response.json();
  } else {
    rawText = await response.text();

    if (rawText) {
      try {
        data = JSON.parse(rawText);
      } catch {
        data = null;
      }
    }
  }

  if (!response.ok) {
    throw new Error(
      data?.message || rawText || `Request failed with status ${response.status}.`,
    );
  }

  if (typeof rawText === 'string' && /<html[\s>]/i.test(rawText)) {
    throw new Error(
      'The API host returned an HTML security page instead of JSON. This usually means the hosting provider is blocking API requests.',
    );
  }

  return {
    data,
    rawText,
  };
}

async function createClass() {
  clearMessages();

  if (!classForm.class_name.trim()) {
    setError('Please enter a class name.');
    return;
  }

  ui.creatingClass = true;

  try {
    const { data, rawText } = await request('/classes', {
      method: 'POST',
      useApiKey: false,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        class_name: classForm.class_name.trim(),
      }),
    });

    if (!data || typeof data !== 'object') {
      throw new Error(rawText || 'The API did not return valid JSON for class creation.');
    }

    api.apiKey = data.api_key || '';
    classSummary.value = data;
    persistState();
    setNotice('Class created successfully. The returned data is shown below.');
    classForm.class_name = '';
  } catch (error) {
    setError(error.message);
  } finally {
    ui.creatingClass = false;
  }
}

function formatJson(value) {
  return JSON.stringify(value, null, 2);
}
</script>

<template>
  <div class="app-shell">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">Teaching API</p>
        <h1>Class creator and API guide</h1>
        <p class="lead">
          Create a class with one input, then use the returned API key to call the rest of the endpoints.
        </p>
      </div>

      <div class="hero-meta">
        <span class="meta-label">Base API</span>
        <strong>{{ api.baseUrl }}</strong>
      </div>
    </section>

    <section class="panel">
      <div class="panel-header">
        <h2>Create Class</h2>
        <span class="panel-note">Only class name is required</span>
      </div>

      <form class="create-form" @submit.prevent="createClass">
        <label class="field">
          <span>Class Name</span>
          <input v-model="classForm.class_name" type="text" placeholder="Enter class name" />
        </label>

        <button class="button button-primary" type="submit" :disabled="ui.creatingClass">
          {{ ui.creatingClass ? 'Creating...' : 'Create Class' }}
        </button>
      </form>
    </section>

    <section v-if="notice || errorMessage" class="message-row">
      <div v-if="notice" class="message message-success">{{ notice }}</div>
      <div v-if="errorMessage" class="message message-error">{{ errorMessage }}</div>
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="panel-header">
          <h2>Returned Data</h2>
          <span class="panel-note">{{ classSummary ? 'Latest response' : 'No response yet' }}</span>
        </div>

        <div v-if="classSummary" class="response-block">
          <div class="summary-grid">
            <div class="summary-card">
              <span>Class Name</span>
              <strong>{{ classSummary.class_name || 'N/A' }}</strong>
            </div>
            <div class="summary-card">
              <span>API Key</span>
              <strong class="truncate">{{ classSummary.api_key || 'N/A' }}</strong>
            </div>
            <div class="summary-card">
              <span>Base API URL</span>
              <strong class="truncate">{{ classSummary.base_api_url || api.baseUrl }}</strong>
            </div>
          </div>

          <pre class="code-block">{{ formatJson(classSummary) }}</pre>
        </div>

        <div v-else class="empty-state">
          <p>Create a class to see the response data here.</p>
        </div>
      </article>

      <article class="panel">
        <div class="panel-header">
          <h2>API Endpoints</h2>
          <span class="panel-note">Method and request body</span>
        </div>

        <div v-if="!hasCreatedClass" class="gate-note">
          Create a class first. Product APIs will appear in this table after the API returns your class key.
        </div>

        <div class="table-wrap">
          <table class="api-table">
            <thead>
              <tr>
                <th>API</th>
                <th>Method</th>
                <th>Path</th>
                <th>Auth</th>
                <th>Request Body</th>
            
              </tr>
            </thead>
            <tbody>
              <tr v-for="endpoint in apiDocs" :key="`${endpoint.method}-${endpoint.path}`">
                <td>{{ endpoint.name }}</td>
                <td><span class="method-pill">{{ endpoint.method }}</span></td>
                <td><code>{{ endpoint.path }}</code></td>
                <td>{{ endpoint.auth }}</td>
                <td><pre>{{ endpoint.body }}</pre></td>
              
              </tr>
            </tbody>
          </table>
        </div>
      </article>
    </section>
  </div>
</template>
