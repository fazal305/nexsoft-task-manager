const Workspace = require('../models/Workspace');

const rolePower = {
  viewer: 1,
  member: 2,
  manager: 3,
  owner: 4
};

function getWorkspaceId(req) {
  return req.params.workspaceId || req.params.id || req.body.workspaceId;
}

function requireRole(requiredRole) {
  return async function roleMiddleware(req, res, next) {
    try {
      const workspaceId = getWorkspaceId(req);

      if (!workspaceId) {
        return res.status(400).json({ message: 'Workspace ID is required' });
      }

      const workspace = await Workspace.findById(workspaceId);

      if (!workspace) {
        return res.status(404).json({ message: 'Workspace not found' });
      }

      const currentMember = workspace.members.find((member) => {
        return member.userId.toString() === req.user._id.toString();
      });

      if (!currentMember) {
        return res.status(403).json({ message: 'You are not a member of this workspace' });
      }

      const userPower = rolePower[currentMember.role];
      const requiredPower = rolePower[requiredRole];

      if (userPower < requiredPower) {
        return res.status(403).json({ message: 'You do not have permission for this action' });
      }

      req.workspace = workspace;
      req.userRole = currentMember.role;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Role check failed', error: error.message });
    }
  };
}

module.exports = {
  requireRole,
  rolePower
};