<script setup>
defineProps({
  rows: { type: Array, required: true },
});
</script>

<template>
  <table class="ro-table">
    <thead>
      <tr>
        <th style="width:110px">TIME</th>
        <th style="width:48px">DUR</th>
        <th>ACTIVITY</th>
        <th style="width:180px">ROLE</th>
        <th style="width:90px">STATUS</th>
      </tr>
    </thead>
    <tbody>
      <tr v-for="(row, i) in rows" :key="i" :class="{ 'row-on-air': row.status === 'on-air' }">
        <td class="time-col">{{ row.time }}</td>
        <td class="dur-col">{{ row.dur }}</td>
        <td>
          <div class="activity-name">{{ row.activity }}</div>
          <div class="activity-loc">{{ row.loc }}</div>
        </td>
        <td class="role-col">{{ row.role }}</td>
        <td><span class="row-status" :class="row.status">{{ row.status.replace('-', ' ').toUpperCase() }}</span></td>
      </tr>
    </tbody>
  </table>
</template>
