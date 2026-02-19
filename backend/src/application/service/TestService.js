const { ISSUE_STATUS, PRIORITY_LEVELS } = require('../../../config/constants');

const TEST_ISSUES = [
  {
    title: 'Nema tople vode',
    description: 'U kupatilu nema tople vode već tri dana',
    priority: PRIORITY_LEVELS.HIGH
  },
  {
    title: 'Lift ne radi',
    description: 'Lift je zaglavio između spratova',
    priority: PRIORITY_LEVELS.HIGH
  },
  {
    title: 'Curi slavina u kuhinji',
    description: 'Slavina u kuhinji kaplje celu noć',
    priority: PRIORITY_LEVELS.MEDIUM
  },
  {
    title: 'Pukla sijalica u hodniku',
    description: 'Sijalica na trećem spratu je pregorela',
    priority: PRIORITY_LEVELS.LOW
  },
  {
    title: 'Nezatvoren prozor na stepeništu',
    description: 'Prozor na drugom spratu ne može da se zatvori',
    priority: PRIORITY_LEVELS.MEDIUM
  },
  {
    title: 'Nema grejanja u stanu',
    description: 'Radijatori su hladni već dva dana',
    priority: PRIORITY_LEVELS.HIGH
  },
  {
    title: 'Prljav ulaz zgrade',
    description: 'Ulaz nije čišćen nedelju dana',
    priority: PRIORITY_LEVELS.LOW
  },
  {
    title: 'Škripi vrata na ulazu',
    description: 'Glavna vrata jako škripe i teško se otvaraju',
    priority: PRIORITY_LEVELS.MEDIUM
  }
];

const TEST_NOTICE_CONTENTS = [
  'Obaveštenje o planiranom održavanju lifta 10. februara od 9h do 15h. Molimo stanare da ne koriste lift tog dana.',
  'Redovno čišćenje stepeništa je planirano svakog ponedeljka i četvrtka. Molimo stanare da ne ostavljaju predmete na stepeništu.',
  'Skupština stanara će se održati 15. februara u 18h u prostorijama zgrade. Molimo sve stanare da prisustvuju.',
  'Grejanje će biti isključeno 12. februara od 8h do 12h zbog servisa kotlarnice.',
  'Molimo stanare da vode računa o zatvaranju ulaznih vrata. Primećeno je da vrata često ostaju otvorena.',
  'Parking mesto broj 7 je trenutno van upotrebe zbog radova. Molimo stanare da koriste alternativna mesta.',
  'Novo radno vreme domara: ponedeljak-petak 8-16h, subota 9-13h. U slučaju hitnosti zovite 064-123-4567.'
];

class TestService {
  constructor(testRepository) {
    this.repo = testRepository;
  }

  async getAuthenticatedUser(username) {
    return this.repo.findUserByUsername(username);
  }

  async seedIssues() {
    const apartment = await this.repo.findFirstApartment();
    const tenant = await this.repo.findFirstTenant();
    if (!apartment || !tenant) {
      const err = new Error('Need at least one apartment and tenant to create issues');
      err.status = 400;
      throw err;
    }

    const created = [];
    for (const data of TEST_ISSUES) {
      const issue = await this.repo.createIssue({
        ...data,
        status: ISSUE_STATUS.FORWARDED,
        apartment: apartment._id,
        createdBy: tenant._id
      });
      created.push(issue);
    }
    return { count: created.length };
  }

  async seedNotices() {
    const building = await this.repo.findFirstBuilding();
    const manager = await this.repo.findFirstManager();
    if (!building || !manager) {
      const err = new Error('Need at least one building and manager to create notices');
      err.status = 400;
      throw err;
    }

    const created = [];
    for (const content of TEST_NOTICE_CONTENTS) {
      const notice = await this.repo.createNotice({
        building: building._id,
        author: manager._id,
        authorName: manager.username,
        authorRole: manager.role,
        content
      });
      created.push(notice);
    }
    return { count: created.length };
  }
}

module.exports = TestService;
