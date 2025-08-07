import { Request, Response } from 'express';
import { getProfile, deleteAccount } from '../../controllers//user.controller';
import { getAllUsers, getPendingImage } from '../../controllers/admin.controller';
import { User } from '../../models/User';
import { Image } from '../../models/Image';
import { AuthRequest } from '../../middlewares/auth.middlewares';

jest.mock('../../models/User');
jest.mock('../../models/Image');

const mockResponse = () => {
  const res: Partial<Response> = {};
  res.json = jest.fn().mockReturnValue(res);
  res.status = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe('Test Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      const req = { user: mockUser } as AuthRequest;
      const res = mockResponse();

      await getProfile(req, res);

      expect(res.json).toHaveBeenCalledWith({ user: mockUser });
    });
  });

  describe('getPendingImage', () => {
    it('should return pending images with user email', async () => {
      const mockImages = [
        { _id: 'img1', status: 'pending', user: { email: 'test1@example.com' } },
        { _id: 'img2', status: 'pending', user: { email: 'test2@example.com' } },
      ];
      (Image.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockImages),
      });

      const req = {} as Request;
      const res = mockResponse();

      await getPendingImage(req, res);

      expect(Image.find).toHaveBeenCalledWith({ status: 'pending' });
      expect(res.json).toHaveBeenCalledWith({ images: mockImages });
    });

    it('should handle errors when fetching pending images', async () => {
      (Image.find as jest.Mock).mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const req = {} as Request;
      const res = mockResponse();

      await expect(getPendingImage(req, res)).rejects.toThrow('Database error');
    });
  });

  describe('getAllUsers', () => {
    it('should return all users without passwords', async () => {
      const mockUsers = [
        { _id: 'user1', email: 'test1@example.com' },
        { _id: 'user2', email: 'test2@example.com' },
      ];
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUsers),
      });

      const req = {} as Request;
      const res = mockResponse();

      await getAllUsers(req, res);

      expect(User.find).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ users: mockUsers });
    });

    it('should handle errors when fetching users', async () => {
      (User.find as jest.Mock).mockReturnValue({
        select: jest.fn().mockRejectedValue(new Error('Database error')),
      });

      const req = {} as Request;
      const res = mockResponse();

      await expect(getAllUsers(req, res)).rejects.toThrow('Database error');
    });
  });

  describe('deleteAccount', () => {
    it('should delete user account and return success message', async () => {
      const mockUser = { id: '123', email: 'test@example.com' };
      (User.findByIdAndDelete as jest.Mock).mockResolvedValue(mockUser);

      const req = { user: mockUser } as AuthRequest;
      const res = mockResponse();

      await deleteAccount(req, res);

      expect(User.findByIdAndDelete).toHaveBeenCalledWith(mockUser.id);
      expect(res.json).toHaveBeenCalledWith({ message: 'User Deleted!' });
    });

    it('should handle errors when deleting user', async () => {
      (User.findByIdAndDelete as jest.Mock).mockRejectedValue(new Error('Delete error'));

      const req = { user: { id: '123' } } as AuthRequest;
      const res = mockResponse();

      await expect(deleteAccount(req, res)).rejects.toThrow('Delete error');
    });
  });
});