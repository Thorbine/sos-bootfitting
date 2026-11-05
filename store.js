// Lokale Entwürfe in IndexedDB (Fotos sind zu groß für localStorage). Es verlässt nichts das Gerät.
const Store = (() => {
  const DB = 'bootfitting', STORE = 'cases';
  const open = () => new Promise((res, rej) => {
    const r = indexedDB.open(DB, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: 'id' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
  const run = async (mode, fn) => {
    const d = await open();
    return new Promise((res, rej) => {
      const t = d.transaction(STORE, mode);
      const req = fn(t.objectStore(STORE));
      t.oncomplete = () => { d.close(); res(req && req.result); };
      t.onerror = () => { d.close(); rej(t.error); };
    });
  };
  return {
    put: c => run('readwrite', s => s.put(c)),
    all: () => run('readonly', s => s.getAll()),
    del: id => run('readwrite', s => s.delete(id)),
    async purgeOld(days) {
      const limit = Date.now() - days * 864e5;
      for (const c of await this.all()) if (c.updatedAt < limit) await this.del(c.id);
    }
  };
})();
