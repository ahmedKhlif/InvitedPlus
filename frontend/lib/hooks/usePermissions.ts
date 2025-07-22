import React, { useMemo, useState, useEffect } from 'react';
import { authService } from '../services';

export type UserRole = 'ADMIN' | 'ORGANIZER' | 'GUEST';

interface Permission {
  resource: string;
  action: string;
  condition?: (user: any, resource?: any) => boolean;
}

interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}

export const usePermissions = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser() as User | null;
    setUser(currentUser);
  }, []);

  const permissions = useMemo(() => {
    if (!user) return new Map<UserRole, Permission[]>();

    const permissionMap = new Map<UserRole, Permission[]>();

    // ADMIN permissions - Full access
    permissionMap.set('ADMIN', [
      // Users
      { resource: 'users', action: 'create' },
      { resource: 'users', action: 'read' },
      { resource: 'users', action: 'update' },
      { resource: 'users', action: 'delete' },
      { resource: 'users', action: 'manage_roles' },
      
      // Events
      { resource: 'events', action: 'create' },
      { resource: 'events', action: 'read' },
      { resource: 'events', action: 'update' },
      { resource: 'events', action: 'delete' },
      { resource: 'events', action: 'manage_all' },
      
      // Tasks
      { resource: 'tasks', action: 'create' },
      { resource: 'tasks', action: 'read' },
      { resource: 'tasks', action: 'update' },
      { resource: 'tasks', action: 'delete' },
      { resource: 'tasks', action: 'assign' },
      
      // Polls
      { resource: 'polls', action: 'create' },
      { resource: 'polls', action: 'read' },
      { resource: 'polls', action: 'update' },
      { resource: 'polls', action: 'delete' },
      
      // Admin
      { resource: 'admin', action: 'access_panel' },
      { resource: 'admin', action: 'view_analytics' },
      { resource: 'admin', action: 'manage_platform' },
    ]);

    // ORGANIZER permissions
    permissionMap.set('ORGANIZER', [
      // Events - Can create and manage own events
      { resource: 'events', action: 'create' },
      { resource: 'events', action: 'read' },
      { 
        resource: 'events', 
        action: 'update',
        condition: (user, event) => event?.createdById === user.id
      },
      { 
        resource: 'events', 
        action: 'delete',
        condition: (user, event) => event?.createdById === user.id
      },
      
      // Tasks
      { resource: 'tasks', action: 'create' },
      { resource: 'tasks', action: 'read' },
      { 
        resource: 'tasks', 
        action: 'update',
        condition: (user, task) => task?.createdById === user.id || task?.assigneeId === user.id
      },
      { 
        resource: 'tasks', 
        action: 'delete',
        condition: (user, task) => task?.createdById === user.id
      },
      
      // Polls
      { resource: 'polls', action: 'create' },
      { resource: 'polls', action: 'read' },
      { 
        resource: 'polls', 
        action: 'update',
        condition: (user, poll) => poll?.createdById === user.id
      },
      { 
        resource: 'polls', 
        action: 'delete',
        condition: (user, poll) => poll?.createdById === user.id
      },
      
      // Chat
      { resource: 'chat', action: 'read' },
      { resource: 'chat', action: 'write' },
    ]);

    // GUEST permissions - Read-only mostly
    permissionMap.set('GUEST', [
      // Events
      { resource: 'events', action: 'read' },
      { resource: 'events', action: 'rsvp' },
      
      // Tasks
      { resource: 'tasks', action: 'read' },
      { 
        resource: 'tasks', 
        action: 'update',
        condition: (user, task) => task?.assigneeId === user.id
      },
      
      // Polls
      { resource: 'polls', action: 'read' },
      { resource: 'polls', action: 'vote' },
      
      // Chat
      { resource: 'chat', action: 'read' },
      { resource: 'chat', action: 'write' },
    ]);

    return permissionMap;
  }, [user?.id, user?.role]);

  const hasPermission = (
    resource: string, 
    action: string, 
    resourceData?: any
  ): boolean => {
    if (!user) return false;

    const rolePermissions = permissions.get(user.role);
    if (!rolePermissions) return false;

    const permission = rolePermissions.find(
      p => p.resource === resource && p.action === action
    );

    if (!permission) return false;

    // Check condition if it exists
    if (permission.condition && resourceData) {
      return permission.condition(user, resourceData);
    }

    return !permission.condition;
  };

  const canCreateEvent = () => hasPermission('events', 'create');
  const canCreateTask = () => hasPermission('tasks', 'create');
  const canCreatePoll = () => hasPermission('polls', 'create');
  const canAccessAdmin = () => hasPermission('admin', 'access_panel');

  const canManageEvent = (event: any) => hasPermission('events', 'update', event);
  const canManageTask = (task: any) => hasPermission('tasks', 'update', task);
  const canManagePoll = (poll: any) => hasPermission('polls', 'update', poll);

  const canDeleteEvent = (event: any) => hasPermission('events', 'delete', event);
  const canDeleteTask = (task: any) => hasPermission('tasks', 'delete', task);
  const canDeletePoll = (poll: any) => hasPermission('polls', 'delete', poll);

  const isAdmin = () => user?.role === 'ADMIN';
  const isOrganizer = () => user?.role === 'ORGANIZER';
  const isGuest = () => user?.role === 'GUEST';

  const canManageUsers = () => hasPermission('users', 'manage_roles');
  const canViewAnalytics = () => hasPermission('admin', 'view_analytics');

  return {
    user,
    hasPermission,
    canCreateEvent,
    canCreateTask,
    canCreatePoll,
    canAccessAdmin,
    canManageEvent,
    canManageTask,
    canManagePoll,
    canDeleteEvent,
    canDeleteTask,
    canDeletePoll,
    canManageUsers,
    canViewAnalytics,
    isAdmin,
    isOrganizer,
    isGuest,
  };
};

// Higher-order component for role-based access
export const withPermission = (
  WrappedComponent: React.ComponentType<any>,
  resource: string,
  action: string,
  fallback?: React.ComponentType<any>
) => {
  return function PermissionWrapper(props: any) {
    const { hasPermission } = usePermissions();

    if (!hasPermission(resource, action)) {
      if (fallback) {
        const FallbackComponent = fallback;
        return React.createElement(FallbackComponent, props);
      }
      return null;
    }

    return React.createElement(WrappedComponent, props);
  };
};

// Component for conditional rendering based on permissions
export const PermissionGate: React.FC<{
  resource: string;
  action: string;
  resourceData?: any;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ resource, action, resourceData, children, fallback = null }) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(resource, action, resourceData)) {
    return React.createElement(React.Fragment, {}, fallback);
  }

  return React.createElement(React.Fragment, {}, children);
};
